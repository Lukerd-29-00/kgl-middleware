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
import { requestStatus } from "rdf-namespaces/dist/cal"

const querySchema = Joi.object({
    since: Joi.string().custom((value: string, helper) => {
        if(isNaN(new Date(value).getTime()) && !isNaN(new Date(parseInt(value,10)).getTime())){
            return value
        }else if(!isNaN(new Date(value).getTime())){
            return value
        }
        return helper.message({custom: "Invalid date for since"})          
    }),
    before: Joi.string().custom((value: string, helper) => {
        if(isNaN(new Date(value).getTime()) && !isNaN(new Date(parseInt(value,10)).getTime())){
            return value
        }else if(!isNaN(new Date(value).getTime())){
            return value
        }
        return helper.message({custom: "Invalid date for before"})   
    }),
    stdev: Joi.string().equal("true","false"),
    median: Joi.string().equal("true","false"),
    mean: Joi.string().equal("true","false")
})

interface ReqQuery extends Query{
    since?: string,
    before?: string,
    stdev?: string,
    mean?: string,
    median?: string
}

interface ReqParams extends ParamsDictionary{
    userID: string,
    content: string
}

export function getNumberAttemptsQuery(userID: string, prefixes: [string, string][], since: number, before: number, contentIRI: string): string{
    let output = getPrefixes(prefixes)
    output += 
    `select ?r ?c where{
        cco:Person_${userID} cco:agent_in ?p .
        ?p cco:has_object <${contentIRI}> ;
            cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
            cco:occurs_on / cco:is_tokenized_by ?t ;
            cco:is_measured_by_ordinal / cco:is_tokenized_by ?r .
        FILTER(?t > ${since} && ?t < ${before})
    } ORDER BY ?r`
    
    return output
}

async function processReadFromLearnerRecord(request: Request<ReqParams,string,Record<string,string>,ReqQuery> , response: Response, ip: string, repo: string, prefixes: Array<[string, string]>) {
    const userID = request.params.userID
    let tmp: undefined | number
    if(request.query.before !== undefined && !isNaN(parseInt(request.query.before,10))){
        tmp = new Date(parseInt(request.query.before,10)).getTime()
    }else if(request.query.before !== undefined){
        tmp = new Date(request.query.before).getTime()
    }else if(request.headers.date !== undefined){
        tmp = new Date(request.headers.date).getTime()
        if(isNaN(tmp)){
            response.status(400)
            response.send("Malformed Date header")
            return
        }
    }else{
        response.status(400)
        response.send("before query parameter is required if no Date header is supplied")
        return
    }
    const before = tmp as number
    let since = before - 8.64e+7
    if(request.query.since && !isNaN(parseInt(request.query.since))){
        since = new Date(parseInt(request.query.since,10)).getTime()
    }else if(request.query.since){
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
            response.send(parsed)
        }).catch((e: Error) => {
            response.status(500)
            response.send(e.message)
        })
    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })
}

const route = "/users/:userID/:content/stats"

const endpoint: Endpoint<ReqParams,string,Record<string,string>,ReqQuery> = { method: "get", schema: {query: querySchema}, route: route, process: processReadFromLearnerRecord }
export default endpoint