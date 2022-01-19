import Joi from "joi"
import {Request, Response} from "express"
import {Response as FetchResponse} from "node-fetch"
import { getPrefixes } from "../util/QueryGenerators/SparqlQueryGenerator"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import commitTransaction from "../util/transaction/commitTransaction"
import {Transaction} from "../util/transaction/Transaction"
import { Endpoint } from "../server"
import {ParamsDictionary, Query} from "express-serve-static-core"
import readline from "readline"
import { PassThrough } from "stream"
const querySchema = Joi.object({
    since: Joi.date().required().max(Joi.ref("before")),
    before: Joi.date().required()
})

export interface ReqParams extends ParamsDictionary{
    userID: string,
    content: string
}

export interface ReqQuery extends Query{
    before: string,
    since: string
}

export interface Answer extends Record<string, unknown>{
    correct: boolean,
    timestamp: number,
    responseTime?: number,
}

function getRawDataQuery(userID: string, content: string, since: number, before: number, prefixes: Array<[string, string]>): string{
    let output = getPrefixes(prefixes)
    output += `select ?t ?c ?r where { 
        {
        cco:Person_${userID} cco:agent_in ?a .
            ?a cco:has_object <${content}> ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
                cco:is_measured_by_ordinal / cco:is_tokenized_by ?r .
                FILTER(?c="true"^^xsd:boolean)
        }
        UNION
        {
            cco:Person_${userID} cco:agent_in ?a .
            ?a cco:has_object <${content}> ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
                BIND("NaN"^^xsd:string as ?r)
                FILTER(?c="false"^^xsd:boolean)
        }    
        FILTER(?t >= ${since} && ?t <= ${before})
    } ORDER BY ?t`
    return output
}

async function processGetRawData(request: Request<ReqParams,Answer[] | string,Record<string,string | boolean | number>,ReqQuery>,response: Response<Answer[] | string>, next: (e?: Error) => void,ip: string, repo: string, prefixes: Array<[string ,string]>): Promise<void>{
    const userID = request.params.userID
    const content = request.params.content
    const before = new Date(request.query.before).getTime()
    const since = new Date(request.query.since).getTime()
    startTransaction(ip, repo).then(location => {
        const transaction: Transaction = {
            subj: null,
            pred: null,
            obj: null,
            location: location as string,
            body: getRawDataQuery(userID,content,since,before,prefixes),
            action: "QUERY"
        }
        ExecTransaction(transaction).then((res: FetchResponse) => {
            const pass = new PassThrough()
            response.setHeader("Content-Type","application/json")
            commitTransaction(location as string).catch(() => {})
            const readWrite = readline.createInterface({input: res.body})
            let firstLine = true
            let secondLine = true
            let length = 0
            readWrite.on("line",async (data: Buffer) => {
                if(firstLine){
                    firstLine = false
                    return
                }
                if(!secondLine){
                    pass.write(",\n")
                    length += 2
                }else{
                    secondLine = false
                    pass.write("[")
                    length += 1
                }
                const match = data.toString().match(/^(.+),(.+),(.+)/)
                if(match === null){
                    throw Error("Invalid response from graphdb")
                }
                const obj = JSON.stringify({timestamp: parseInt(match[1],10), correct: match[2] === "true" ? true : false, responseTime: isNaN(parseInt(match[3],10)) ? undefined : parseInt(match[3],10)})
                length += obj.length
                return new Promise<void>(resolve => {
                    pass.write(obj,() => {
                        resolve()
                    })
                })
            })
            readWrite.on("close", () => {
                response.locals.stream = pass
                response.locals.append = length > 0 ? "]" : "[]"
                response.locals.length = length
                next()
            })

        }).catch((e: Error) => {
            next(e)
        })
    }).catch((e: Error) => {
        next(e)
    })
}

const route = "/users/:userID/data/:content"

const endpoint: Endpoint<ReqParams,Answer[] | string,Record<string, string | boolean | number>,ReqQuery> = {
    route,
    schema: {query: querySchema},
    process: processGetRawData,
    method: "get"
}

export default endpoint

