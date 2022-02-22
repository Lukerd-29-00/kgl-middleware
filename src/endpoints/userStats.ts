import {getPrefixes} from "../util/QueryGenerators/SparqlQueryGenerator"
import readline from "readline"
import Joi from "joi"
import {Request, Response} from "express"
import { parseQueryOutput } from "../util/QueryOutputParsing/ParseContent"
import startTransaction from "../util/transaction/startTransaction"
import {execTransaction, BodyAction, BodyLessAction} from "../util/transaction/execTransaction"
import { EmptyObject, Endpoint, Locals, Method, Optional } from "../server"
import { Logger } from "winston"

/**The route that calls this middleware */
const route = "/users/:userID/stats"

/**The path parameters for this resource */
export interface ReqParams extends Record<string,string>{
    userID: string
}

/**The query parameters for this resource */
export interface ReqQuery extends Record<string,Optional<string>>{
    since?: string,
    before?: string,
    stdev?: string,
    mean?: string,
}

/**A schema that the request's query string needs to follow after parsing */
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

/**Generates a SPARQL query to retrieve stats about the answers the user has made for all questions in the specified time period
 * @param userID The user the data is being queried for
 * @param content The content the query is concerning
 * @param since The earliest acceptable date for the query in Unix time
 * @param before The latest acceptable date for the query in Unix time
 * @param prefixes The prefixes used in the SPARQL query.
 * @returns A SPARQL query to retrieve stats about the answers the user has made for all questions in the specified time period
 */
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

/**Processes a request to the /users/:userID/stats route by retrieving stats (see readme for which stats) for every subject they've supplied answers for in the desired time interval and putting the data into a PassThrough stream in response.locals.stream, as well as the number of bytes in that stream in response.locals.length, before calling next(). Calls next(e) for any errors e it encounters.
 * @param request The request made to /users/:userID/stats
 * @param response The response to request
 * @param next A callback that calls the next middleware function in the stack
 * @param ip The URL of the graphdb server
 * @param repo The repository to read from
 * @param prefixes The prefixes to use in the SPARQL query
 * @async
 */
async function processUserStats(request: Request<ReqParams,string,EmptyObject,ReqQuery> , response: Response<string, Locals>,next: (e?: Error) => void, ip: string, repo: string, log: Logger | null, prefixes: Array<[string, string]>): Promise<void> {
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
    startTransaction(ip, repo).then(location => {
        return execTransaction(BodyAction.QUERY,location,prefixes,query).then(res => {
            execTransaction(BodyLessAction.COMMIT,location).catch(e => {
                if(log){
                    log.error("error: ", {message: e.message})
                }
            })
            response.setHeader("Content-Type","application/json")
            return parseQueryOutput(readline.createInterface({input: res.body}),response.locals.stream,{stdev: request.query.stdev === "true", median: request.query.median === "true", mean: request.query.mean === "true"}).then(() => {
                next()
            })
        })
    }).catch((e: Error) => {
        next(e)
    })
}

const endpoint: Endpoint<ReqParams,string,EmptyObject,ReqQuery,Locals> = { 
    method: Method.GET, 
    schema: {query: querySchema},
    route: route,
    process: processUserStats
}
export default endpoint