import { Request, Response } from "express"
import Joi from "joi"
import { Endpoint } from "../server"
import {getPrefixes} from "../util/QueryGenerators/SparqlQueryGenerator"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import commitTransaction from "../util/transaction/commitTransaction"
import {ParamsDictionary, Query} from "express-serve-static-core"

const querySchema = Joi.object({
    content: Joi.string(),
    since: Joi.number(),
    before: Joi.number()
})

interface ReqQuery extends Query{
    content?: string,
    since?: string,
    before?: string
}

interface ResBody{
    correct: number,
    attempts: number
}

interface ReqParams extends ParamsDictionary{
    userID: string
}

export function getNumberAttemptsQuery(userID: string, prefixes: [string, string][], since: number, before: number, contentIRI?: string): string{
    let output = getPrefixes(prefixes)
    if(contentIRI !== undefined){    
        output += 
        `select (count(?p) as ?attempts) (sum(?corr) as ?correct) where{
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object <${contentIRI}> ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t .
            FILTER(?t > ${since} && ?t < ${before})
            BIND ( IF ( ?c = "true"^^xsd:boolean, 1, IF ( ?c = "false"^^xsd:boolean, 0, 0 ) ) AS ?corr )
        }`
    }else{
        output += 
        `select ?content (count(?p) as ?attempts) (sum(?corr) as ?correct) where {
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object ?content ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t .
            FILTER(?t > ${since} && ?t < ${before})
            BIND ( IF ( ?c = "true"^^xsd:boolean, 1, IF ( ?c = "false"^^xsd:boolean, 0, 0 ) ) AS ?corr )
        }GROUP BY ?content`
    }
    return output
}

function parseQueryOutput<T extends string | undefined>(response: string, content?: T): T extends string ? [number, number] : Map<string,ResBody>{
    if(content !== undefined){
        const line = response.split("\n")[1].split(",")
        return [parseInt(line[0],10), parseInt(line[1],10)] as T extends string ? [number, number] : Map<string,ResBody>
    }else{
        const matches = response.matchAll(/^(.+),(.+),(.+)$/gm)
        matches.next()
        const output = new Map<string,ResBody>()
        for(const match of matches){
            output.set(match[1],{attempts: parseInt(match[2],10), correct: parseInt(match[3],10)})
        }
        return output as T extends string ? [number, number] : Map<string,ResBody>
    }
}

async function processReadFromLearnerRecord(request: Request<ReqParams,string,Record<string,string>,ReqQuery> , response: Response, ip: string, repo: string, prefixes: Array<[string, string]>) {
    const userID = request.params.userID
    let before = new Date().getTime()
    if(request.query.before !== undefined){
        before = new Date(request.query.before).getTime()
    }else if(request.headers.date !== undefined){
        before = new Date(request.headers.date).getTime()
        if(isNaN(before)){
            response.status(400)
            response.send("Malformed Date header")
            return
        }
    }
    const query = getNumberAttemptsQuery(userID,prefixes,request.query.since === undefined ? 0 : new Date(request.query.since).getTime(),before,request.body.content)
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
            commitTransaction(location).catch(() => {})
            if(request.body.content !== undefined){
                const parsed = parseQueryOutput(res, request.body.content)
                response.header("Content-Type","application/json")
                response.send({attempts: parsed[0], correct: parsed[1]})
            }else{
                const parsed = parseQueryOutput(res)
                response.header("Content-Type","application/json")
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

const route = "/readFromLearnerRecord/:userID"

const endpoint: Endpoint<ReqParams,string,Record<string,string>,ReqQuery> = { method: "post", schema: {query: querySchema}, route: route, process: processReadFromLearnerRecord }
export default endpoint