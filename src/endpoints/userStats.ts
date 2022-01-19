import {getPrefixes} from "../util/QueryGenerators/SparqlQueryGenerator"
import {Query, ParamsDictionary} from "express-serve-static-core"
import readline from "readline"
import Joi from "joi"
import {Request, Response} from "express"
import { parseQueryOutput } from "../util/QueryOutputParsing/ParseContent"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import commitTransaction from "../util/transaction/commitTransaction"
import { Transaction } from "../util/transaction/Transaction"
import { Endpoint } from "../server"

const route = "/users/:userID/stats"

export interface ReqParams extends ParamsDictionary{
    userID: string
}

export interface ReqQuery extends Query{
    since?: string,
    before?: string,
    stdev?: string,
    mean?: string,
}

export const querySchema = Joi.object({
    since: Joi.when("before",{
        is: Joi.date().required(),
        then: Joi.date().max(Joi.ref("before")),
        otherwise: Joi.date()
    }),
    before: Joi.date(),
    stdev: Joi.string().equal("true","false"),
    median: Joi.string().equal("true","false"),
    mean: Joi.string().equal("true","false")
})

export function getNumberAttemptsQuery(userID: string, prefixes: [string, string][], since: number, before: number): string{
    let output = getPrefixes(prefixes)
    output += 
    `select ?content ?r ?c where {
        {
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object ?content ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
            FILTER(?c="false"^^xsd:boolean)
            BIND("NaN"^^xsd:string as ?r)
        }
        UNION
        {
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object ?content ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
                cco:is_measured_by_ordinal / cco:is_tokenized_by ?r .
            FILTER(?c="true"^^xsd:boolean)
            
        }
        FILTER(?t >= ${since} && ?t <= ${before})
    }ORDER BY ?content ?r`
    return output
}

async function processUserStats(request: Request<ReqParams,string,Record<string,string>,ReqQuery> , response: Response,next: (e?: Error) => void, ip: string, repo: string, prefixes: Array<[string, string]>): Promise<void> {
    const userID = request.params.userID
    let before = new Date().getTime()
    if(request.query.before !== undefined){
        before = new Date(request.query.before).getTime()
    }else if(request.headers.date !== undefined){
        before = new Date(request.headers.date).getTime()
        if(isNaN(before)){
            response.status(400)
            next(Error("Malformed Date header"))
            return
        }
    }
    let since = before - 8.64e+7
    if(request.query.since){
        since = new Date(request.query.since).getTime()
    }
    const query = getNumberAttemptsQuery(userID,prefixes,since,before)
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
            response.setHeader("Content-Type","application/json")
            parseQueryOutput(readline.createInterface({input: res.body, output: response}),{stdev: request.query.stdev === "true", median: request.query.median === "true", mean: request.query.mean === "true"}).then(output => {
                response.locals.stream = output[0]
                response.locals.length = output[1]
                next()
            })
        }).catch((e: Error) => {
            next(e)
        })
    }).catch((e: Error) => {
        next(e)
    })
}

const endpoint: Endpoint<ReqParams,string,Record<string,string>,ReqQuery> = { method: "get", schema: {query: querySchema}, route: route, process: processUserStats }
export default endpoint