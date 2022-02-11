import { Request, Response } from "express"
import readline from "readline"
import { Endpoint } from "../server"
import {getPrefixes} from "../util/QueryGenerators/SparqlQueryGenerator"
import startTransaction from "../util/transaction/startTransaction"
import {execTransaction, BodyAction, BodyLessAction} from "../util/transaction/execTransaction"
import {ParamsDictionary, Query} from "express-serve-static-core"
import { parseQueryOutput } from "../util/QueryOutputParsing/ParseContent"
import { querySchema } from "./userStats"

const route = "/users/:userID/stats/:content"

/**The path parameters for this resource */
export interface ReqParams extends ParamsDictionary{
    userID: string,
    content: string
}

/**The query parameters for this resource */
export interface ReqQuery extends Query{
    since?: string,
    before?: string,
    stdev?: string,
    mean?: string,
}

/**Generates a SPARQL query to retrieve the answers to questions concerning the desired content by the desired user during the desired time interval.
 * @param userID The user the data is being queried for
 * @param content The content the query is concerning
 * @param since The earliest acceptable date for the query in Unix time
 * @param before The latest acceptable date for the query in Unix time
 * @param prefixes The prefixes used in the SPARQL query.
 * @returns A SPARQL query that will retrieve the time, correctness, and response time of all answers for the desired subject by the desired user since the since argument and before the before argument
 */
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

/**Processes a requst to the /users/:userID/stats/:content route by retrieving the desired statistics from the database (see readme for details on what stats are retrieved) and placing the output into a PassThrough stream in response.locals.stream and the length of the output into response.locals.length before calling next(). Calls next(e) for any errors e it encounters.
 * @param request The request made to the route
 * @param response The response to request
 * @param next A callback that calls the next middleware function in the stack
 * @param ip The url to the graphdb server
 * @param repo The repository being read from
 * @param prefixes The prefixes used for SPARQL queries
 * @async
 */
async function processUserContentStats(request: Request<ReqParams,string,Record<string,string>,ReqQuery> , response: Response, next: (e?: Error) => void, ip: string, repo: string, prefixes: Array<[string, string]>): Promise<void> {
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
            return
        }
    }
    let since = before - 8.64e+7
    if(request.query.since){
        since = new Date(request.query.since).getTime()
    }
    const query = getNumberAttemptsQuery(userID,prefixes,since,before,request.params.content)
    startTransaction(ip, repo).then((location) => {
        execTransaction(BodyAction.QUERY, location, prefixes, query).then(res => {
            execTransaction(BodyLessAction.COMMIT,location).catch(() => {})
            response.setHeader("Content-Type","application/json")
            parseQueryOutput(readline.createInterface({input: res.body}), {stdev: request.query.stdev === "true", mean: request.query.mean === "true", content: true}).then(output => {
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

const endpoint: Endpoint<ReqParams,string,Record<string,string>,ReqQuery> = { method: "get", schema: {query: querySchema}, route: route, process: processUserContentStats }
export default endpoint