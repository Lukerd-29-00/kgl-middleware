import Joi from "joi"
import {Request, Response} from "express"
import { getPrefixes } from "../util/QueryGenerators/SparqlQueryGenerator"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import commitTransaction from "../util/transaction/commitTransaction"
import {Transaction} from "../util/transaction/Transaction"
import { Endpoint } from "../server"
import {ParamsDictionary, Query} from "express-serve-static-core"
const querySchema = Joi.object({
    since: Joi.string().required().custom((value: string, helper) => {
        if(isNaN(new Date(value).getTime()) && !isNaN(new Date(parseInt(value,10)).getTime())){
            return value
        }else if(!isNaN(new Date(value).getTime())){
            return value
        }
        return helper.message({custom: "Invalid date for since"})          
    }),
    before: Joi.string().required().custom((value: string, helper) => {
        if(isNaN(new Date(value).getTime()) && !isNaN(new Date(parseInt(value,10)).getTime())){
            return value
        }else if(!isNaN(new Date(value).getTime())){
            return value
        }
        return helper.message({custom: "Invalid date for before"})   
    }),
})

interface ReqParams extends ParamsDictionary{
    userID: string,
    content: string
}

interface ReqQuery extends Query{
    before: string,
    since: string
}

interface Answer{
    correct: boolean,
    timestamp: number,
    responseTime: number,
}

function getRawDataQuery(userID: string, content: string, since: number, before: number, prefixes: Array<[string, string]>): string{
    let output = getPrefixes(prefixes)
    output += `select ?t ?c ?r where {
        cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object <${content}> ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
                cco:is_measured_by_ordinal / cco:is_tokenized_by ?r .
            FILTER(?t > ${since} && ?t < ${before})
    } ORDER BY ?t`
    return output
}

async function processGetRawData(request: Request<ReqParams,Answer[] | string,Record<string,string | boolean | number>,ReqQuery>,response: Response<Answer[] | string>, ip: string, repo: string, prefixes: Array<[string ,string]>): Promise<void>{
    const userID = request.params.userID
    const content = request.params.content
    let tmp: number | undefined
    if(!isNaN(parseInt(request.query.before))){
        tmp = new Date(parseInt(request.query.before,10)).getTime()
    }else{
        tmp = new Date(request.query.before).getTime()
    }
    const before = tmp as number
    if(!isNaN(parseInt(request.query.since))){
        tmp = new Date(parseInt(request.query.since,10)).getTime()
    }else{
        tmp = new Date(request.query.since).getTime()
    }
    const since = tmp as number
    const location = await startTransaction(ip, repo).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
        throw e
    })
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        location,
        body: getRawDataQuery(userID,content,since,before,prefixes),
        action: "QUERY"
    }
    await ExecTransaction(transaction).then((res: string) => {
        commitTransaction(location).catch(() => {})
        const output = new Array<Answer>()
        const matches = res.matchAll(/^(.+),(.+),(.+)$/gm)
        matches.next()
        for(const match of matches){
            output.push({timestamp: parseInt(match[1],10), correct: match[2] === "true" ? true : false, responseTime: parseInt(match[3],10)})
        }
        response.send(output)
    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })
}

const route = "/users/data/:userID/:content"

const endpoint: Endpoint<ReqParams,Answer[] | string,Record<string, string | boolean | number>,ReqQuery> = {
    route,
    schema: {query: querySchema},
    process: processGetRawData,
    method: "get"
}

export default endpoint

