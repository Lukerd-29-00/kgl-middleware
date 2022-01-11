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
    content?: string,
    since?: string,
    before?: string,
    stdev?: string,
    mean?: string,
    median?: string
}

interface ReqParams extends ParamsDictionary{
    userID: string
}

export function getNumberAttemptsQuery(userID: string, prefixes: [string, string][], since: number, before: number, contentIRI?: string): string{
    let output = getPrefixes(prefixes)
    if(contentIRI !== undefined){    
        output += 
        `select ?r ?c where{
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object <${contentIRI}> ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
                cco:is_measured_by_ordinal / cco:is_tokenized_by ?r .
            FILTER(?t > ${since} && ?t < ${before})
        } ORDER BY ?r`
    }else{
        output += 
        `select ?content ?r ?c where {
            cco:Person_${userID} cco:agent_in ?p .
            ?p cco:has_object ?content ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c ;
                cco:occurs_on / cco:is_tokenized_by ?t ;
                cco:is_measured_by_ordinal / cco:is_tokenized_by ?r .
            FILTER(?t > ${since} && ?t < ${before})
        }ORDER BY ?content ?r`
    }
    return output
}

interface ResBody{
    correct: number,
    attempts: number,
    mean?: number,
    median?: number,
    stdev?: number
}

interface ParseQueryOptions extends Record<string, boolean | undefined>{
    mean?: boolean,
    median?: boolean,
    stdev?: boolean,
}

interface ParseQueryOptionsWithContent extends ParseQueryOptions{
    content: boolean
}

function parseContent(response: [string, string][], options?: ParseQueryOptions ): ResBody{
    if(options !== undefined){
        const output: ResBody = {
            correct: 0,
            attempts: 0
        }
        let responseTimes
        if(options.stdev || options.mean || options.median){
            responseTimes = new Array<number>()
        }
        for(const match of response){
            if(responseTimes){
                responseTimes.push(parseInt(match[0],10))
            }
            if(match[1] === "true"){
                output.correct++
            }
            output.attempts++
        }
        if(options.mean){
            output.mean = (responseTimes as number[]).reduce((prev: number, current: number) => {
                return current + prev
            })/(responseTimes as number[]).length
        }
        if(options.stdev){
            const mean = (responseTimes as number[]).reduce((prev: number, current: number) => {
                return current + prev
            })/(responseTimes as number[]).length
            const variance = (responseTimes as number[]).reduce((prev: number, current: number) => {
                return prev + (current - mean)
            })/((responseTimes as number[]).length-1)
            output.stdev = Math.sqrt(variance)
        }
        if(options.median && (responseTimes as number[]).length % 2){
            output.median = (responseTimes as number[])[Math.floor((responseTimes as number[]).length/2)]
        }else if(options.median){
            output.median = ((responseTimes as number[])[Math.floor((responseTimes as number[]).length/2)] + (responseTimes as number[])[Math.ceil((responseTimes as number[]).length/2)])/2
        }
        return output
    }else{
        const output: ResBody = {
            correct: 0,
            attempts: 0
        }
        for(const match of response){
            if(match[1] === "true"){
                output.correct++
            }
            output.attempts++
        }
        return output
    }
}

function parseQueryOutput(response: string, options?: ParseQueryOptions): Map<string, ResBody>

function parseQueryOutput(response: string, options?: ParseQueryOptionsWithContent): ResBody

function parseQueryOutput(response: string, options?: ParseQueryOptionsWithContent | ParseQueryOptions): Map<string, ResBody> | ResBody{
    if(options === undefined || !options.content){
        const output = new Map<string,ResBody>()
        const matches = response.matchAll(/^(.+),(.+),(.+)$/gm)
        matches.next()
        let currentContent = ""
        let linesWithCurrentContent = new Array<[string, string]>()
        for(const match of matches){
            if(match[1] === currentContent){
                linesWithCurrentContent.push([match[2], match[3]])
            }else{
                if(currentContent !== ""){
                    output.set(currentContent,parseContent(linesWithCurrentContent,options))
                }
                currentContent = match[1]
                linesWithCurrentContent = new Array<[string, string]>()
            }
        }
        return output
    }else{
        const lines = new Array<[string, string]>()
        const matches = response.matchAll(/^(.+),(.+)$/gm)
        matches.next()
        for(const match of matches){
            lines.push([match[1],match[2]])
        }
        return parseContent(lines,options)
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
    const query = getNumberAttemptsQuery(userID,prefixes,request.query.since === undefined ? before - 8.64e+7 : new Date(request.query.since).getTime(),before,request.query.content)
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
            if(request.query.content !== undefined){
                const parsed = parseQueryOutput(res, {stdev: request.query.stdev === "true", median: request.query.median === "true", mean: request.query.mean === "true", content: true})
                response.header("Content-Type","application/json")
                response.send(parsed)
            }else{
                const parsed = parseQueryOutput(res,{stdev: request.query.stdev === "true", median: request.query.median === "true", mean: request.query.mean === "true"})
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

const route = "/:userID"

const endpoint: Endpoint<ReqParams,string,Record<string,string>,ReqQuery> = { method: "get", schema: {query: querySchema}, route: route, process: processReadFromLearnerRecord }
export default endpoint