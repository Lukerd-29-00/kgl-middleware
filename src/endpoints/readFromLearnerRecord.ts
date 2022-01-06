import { Request, Response } from "express"
import Joi from "joi"
import { Endpoint } from "../server"
import { getPrefixes } from "../util/QueryGenerators/SparqlQueryGenerator"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import commitTransaction from "../util/transaction/commitTransaction"
import { ParamsDictionary } from "express-serve-static-core"


const schema = Joi.object({
    userID: Joi.string().required(),
    content: Joi.string(),
    since: Joi.number(),
    before: Joi.number()
})

interface ReqBody {
    userID: string,
    content?: string,
    since?: number,
    before?: number
}

interface ResBody {
    literal: string,
    countsCorrect: number,
    totalCounts: number
}

function getNumberAttemptsQuery(userID: string, prefixes: [string, string][], contentIRI?: string): string {
    let output = getPrefixes(prefixes)
    if (contentIRI !== undefined) {
        output +=
            `select (count(?p) as ?attempts) (sum(?corr) as ?correct) where{
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object <${contentIRI}> ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c .
            BIND ( IF ( ?c = "true"^^xsd:boolean, 1, IF ( ?c = "false"^^xsd:boolean, 0, 0 ) ) AS ?corr )
        }`
    } else {
        output +=
            `select ?content ?Literal (count(?ActOfLearning ) as ?totalCounts) (sum(?corr) as ?countsCorrect) where {
                cco:Person_${userID} cco:agent_in ?ActOfLearning .
                ?ActOfLearning cco:has_object ?content ;
                    cco:is_measured_by_nominal / cco:is_tokenized_by ?c .
        
                ?content cco:is_measured_by_nominal ?glyph . 
                ?glyph cco:has_text_value ?Literal
                BIND ( IF ( ?c = "true"^^xsd:boolean, 1, IF ( ?c = "false"^^xsd:boolean, 0, 0 ) ) AS ?corr )
            }GROUP BY ?content ?Literal`
    }
    return output
}

function parseQueryOutput<T extends string | undefined>(response: string, content?: T): T extends string ? [number, number] : Map<string, ResBody> {
    if (content !== undefined) {
        const line = response.split("\n")[1].split(",")
        return [parseInt(line[0], 10), parseInt(line[1], 10)] as T extends string ? [number, number] : Map<string, ResBody>
    } else {
        const matches = response.matchAll(/^(.+),(.+),(.+),(.+)$/gm)
        matches.next()
        const output = new Map<string, ResBody>()
        for (const match of matches) {
            output.set(match[1], { literal: match[2], totalCounts: parseInt(match[3], 10), countsCorrect: parseInt(match[4], 10) })
        }
        return output as T extends string ? [number, number] : Map<string, ResBody>
    }
}

async function processReadFromLearnerRecord(request: Request<ParamsDictionary, string, ReqBody>, response: Response, ip: string, repo: string, prefixes: Array<[string, string]>) {
    const userID = request.body.userID
    const query = getNumberAttemptsQuery(userID, prefixes, request.body.content)
    startTransaction(ip, repo).then((location) => {
        const transaction: Transaction = {
            subj: null,
            pred: null,
            obj: null,
            action: "QUERY",
            body: query,
            location: location
        }
        ExecTransaction(transaction, prefixes).then((res) => {
            commitTransaction(location).catch((e: Error) => {
                console.log(e.message)
            })
            if (request.body.content !== undefined) {
                const parsed = parseQueryOutput(res, request.body.content)
                response.header("Content-Type", "application/json")
                response.send({ attempts: parsed[0], correct: parsed[1] })
            } else {
                const parsed = parseQueryOutput(res)
                response.header("Content-Type", "application/json")
                response.send(Object.fromEntries(parsed.entries()))
            }
        }).catch((e: Error) => {
            response.status(500)
            response.send(e.message)
        })
    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })
}

const route = "/readFromLearnerRecord"

const endpoint: Endpoint = { method: "post", schema: schema, route: route, process: processReadFromLearnerRecord }
export default endpoint