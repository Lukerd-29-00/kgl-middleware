import { Request, Response } from "express"
import Joi from "joi"
import { Endpoint } from "../server"
import {getPrefixes} from "../util/QueryGenerators/SparqlQueryGenerator"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import commitTransaction from "../util/transaction/commitTransaction"
import {ParamsDictionary, Query} from "express-serve-static-core"
import { parseQueryOutput } from "../util/QueryOutputParsing/ParseContent"
import { ResBody } from "../util/QueryOutputParsing/ParseContent"
import { querySchema } from "./userStats"

const route = "/users/stats/:userID/:content"

export interface ReqParams extends ParamsDictionary{
    userID: string,
    content: string
}

export interface ReqQuery extends Query{
    since?: string,
    before?: string,
    stdev?: string,
    mean?: string,
    median?: string
}



export function getNumberAttemptsQuery(userID: string, prefixes: [string, string][], since: number, before: number, content: string): string{
    let output = getPrefixes(prefixes)
    output += 
    `select ?r ?c where {
        {
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object <${content}> ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
            FILTER(?c="false"^^xsd:boolean)
            BIND("NaN"^^xsd:string as ?r)
        }
        UNION
        {
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object <${content}> ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
                cco:is_measured_by_ordinal / cco:is_tokenized_by ?r .
            FILTER(?c="true"^^xsd:boolean)
        }
        FILTER(?t >= ${since} && ?t <= ${before})
    }ORDER BY ?content ?r`
    
    return output
}

async function processReadFromLearnerRecord(request: Request<ReqParams,string,Record<string,string>,ReqQuery> , response: Response, next: (e?: Error) => void, ip: string, repo: string, prefixes: Array<[string, string]>) {
    const userID = request.params.userID
    let before = new Date().getTime()
    if(request.query.before !== undefined){
        before = new Date(request.query.before).getTime()
    }else if(request.headers.date !== undefined){
        before = new Date(request.headers.date).getTime()
        if(isNaN(before)){
            const e = Error("Malformed Date header")
            response.status(400)
            next(e)
            throw e
        }
    }
    let since = before - 8.64e+7
    if(request.query.since){
        since = new Date(request.query.since).getTime()
    }
    const query = getNumberAttemptsQuery(userID,prefixes,since,before,request.params.content)
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
            const parsed = parseQueryOutput(res, {stdev: request.query.stdev === "true", median: request.query.median === "true", mean: request.query.mean === "true", content: true})
            response.locals.body = parsed
            next()
        }).catch((e: Error) => {
            next(e)
            throw e
        })
    }).catch((e: Error) => {
        next(e)
        throw e
    })
}

const endpoint: Endpoint<ReqParams,string,Record<string,string>,ReqQuery> = { method: "get", schema: {query: querySchema}, route: route, process: processReadFromLearnerRecord }
export default endpoint