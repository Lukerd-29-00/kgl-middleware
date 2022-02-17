import Joi from "joi"
import {Request, Response} from "express"
import {Response as FetchResponse} from "node-fetch"
import { getPrefixes } from "../util/QueryGenerators/SparqlQueryGenerator"
import startTransaction from "../util/transaction/startTransaction"
import {execTransaction, BodyAction, BodyLessAction} from "../util/transaction/execTransaction"
import { EmptyObject, Endpoint, Locals, Method } from "../server"
import {ParamsDictionary} from "express-serve-static-core"
import readline from "readline"
/**A schema that the query parameters need to follow. */
const querySchema = Joi.object({
    since: Joi.date().required().max(Joi.ref("before")),
    before: Joi.date().required()
})

/**The path parameters for this resource */
export interface ReqParams extends ParamsDictionary{
    userID: string,
    content: string
}

/**The query parameters for this resource */
export interface ReqQuery extends Record<string, string>{
    before: string,
    since: string
}

/**The format for a statement in the database */
export interface Answer extends Record<string, unknown>{
    correct: boolean,
    timestamp: number,
    responseTime?: number,
}

/**Generates a SPARQL query to retrieve the answers to questions concerning the desired content by the desired user during the desired time interval.
 * @param userID The user the data is being queried for
 * @param content The content the query is concerning
 * @param since The earliest acceptable date for the query in Unix time
 * @param before The latest acceptable date for the query in Unix time
 * @param prefixes The prefixes used in the SPARQL query.
 * @returns A SPARQL query that will retrieve the time, correctness, and response time of all answers for the desired subject by the desired user since the since argument and before the before argument
 */
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

/**Processes a GET or HEAD request to the /users/:userID/data/:content resource by retrieving all of the statements concerning this user and content between the since and before query parameters and returning them as a JSON array. Calls next() after putting all the response data into a PassThrough stream under response.locals.stream, the number of characters written to the stream in response.locals.length, and characters to end the response in response.locals.append. Also changes the response header Content-Type to application json. Calls next(e) for any errors it encounters.
 * @param request The request sent to the /active resource
 * @param response The response to request
 * @param next A callback that calls the next function in the middleware stack
 * @param ip The url of the graphdb server
 * @param repo The desired repository
 * @param prefixes The prefixes that any SPARQL queries may use
 * @async
 */
async function processGetRawData(request: Request<ReqParams,string,EmptyObject,ReqQuery>,response: Response<string,Locals>, next: (e?: Error) => void,ip: string, repo: string, prefixes: Array<[string ,string]>): Promise<void>{
    const userID = request.params.userID
    const content = request.params.content
    const before = new Date(request.query.before).getTime()
    const since = new Date(request.query.since).getTime()
    startTransaction(ip, repo).then(location => {
        execTransaction(BodyAction.QUERY, location, prefixes, getRawDataQuery(userID,content,since,before,prefixes)).then((res: FetchResponse) => {
            response.setHeader("Content-Type","application/json")
            execTransaction(BodyLessAction.COMMIT,location).catch(() => {})
            const readWrite = readline.createInterface({input: res.body})
			response.locals.stream.write("[")
			//This skips the first line of the response, which is the variable names.
            readWrite.once("line",async () => { 
				//This causes commas to be added after the first object is written.
				readWrite.once("line",() => { 
					readWrite.prependListener("line",() => {
						response.locals.stream.write(",")
					})
				})
				//This is writing the actual data to pass.
				readWrite.on("line",(data: Buffer) => {
					const match = data.toString().match(/^(.+),(.+),(.+)/)
					if(match === null){
						next(Error("Invalid response from graphdb"))
						readWrite.close()
						return
					}
					const obj = JSON.stringify({timestamp: parseInt(match[1],10), correct: match[2] === "true" ? true : false, responseTime: isNaN(parseInt(match[3],10)) ? undefined : parseInt(match[3],10)})
					response.locals.stream.write(obj)
				})
			})
            readWrite.once("close", () => {
				response.locals.stream.end("]")
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

const endpoint: Endpoint<ReqParams,string,EmptyObject,ReqQuery,Locals> = {
    route,
    schema: {query: querySchema},
    process: processGetRawData,
    method: Method.GET
}

export default endpoint

