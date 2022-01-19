// We should add some way to verify who the request is coming from; there needs to be some kind of authentication to stop people from messing with each others' accounts!
/**
 *  Middleware software For Knowledge Apps and Leaners Models
 *  Knowledge Graphs For learners 
 *  Casey Rock 
 *  July 30, 2021
 */
import express, { Express, Request, Response } from "express"
import morgan from "morgan"
import Joi, { Schema } from "joi"
import {ParamsDictionary, Query} from "express-serve-static-core"
import {PassThrough} from "stream"

type plainOrArrayOf<T> = Array<T> | T

/**This is a specific type of middleware, intended to retrieve the desired data or write it to the database. Places the data into a PassThrough stream under response.locals.stream, the number of bytes in the stream under response.locals.length, and any characters to be added to the stream before reading in the response.locals.append variable. */
type processor<P extends ParamsDictionary,S extends plainOrArrayOf<string | number | Record<string,unknown> | undefined>,R extends Record<string, string | number | boolean | undefined>,Q extends Query> = 
((request: Request<P,S,R,Q>, response: Response<S>,next: (e?: Error) => void, ip: string, repo: string, prefixes: Array<[string, string]>) => Promise<void>) 
| ((request: Request, response: Response, next: (e?: Error) => void, ip: string, repo: string) => Promise<void>)

/**This holds all the data required to determine what to do if a user queries the route field */
export interface Endpoint<P extends ParamsDictionary,S extends plainOrArrayOf<string | number | Record<string,unknown> | undefined>,R extends Record<string, string | number | boolean | undefined>,Q extends Query>{
    schema: RequestSchema,
    route: string,
    method: "put" | "post" | "delete" | "get",
    process: processor<P,S,R,Q>
}

interface RequestSchema{
    query?: Schema,
    body?: Schema
}

/**Sends a response that has been pre-processed by a processor (see above). Always ends the response. The response should not be ended before this function is called.
 * @param request The original request
 * @param response The response to send back
 */
async function send(request: Request, response: Response): Promise<void>{ //eslint-disable-line
    const stream = response.locals.stream as PassThrough | undefined
    let length = response.locals.length || 0 
    if(stream !== undefined){
        if(request.method === "HEAD"){
            response.status(204)
        }
        const sender = () => {
            const writes = new Array<Promise<void>>()
            if(response.locals.append !== undefined){
                length += response.locals.append.length
            }
            response.setHeader("Content-Length",length)
            stream.pause()
            stream.on("data", data => {
                writes.push(new Promise<void>(resolve => {
                    response.write(data, () => {
                        resolve()
                    })
                }))
                
            })
            stream.read()
            stream.end()
            stream.destroy()
            Promise.all(writes).then(() => {
                response.end()
            })
        }
        if(response.locals.append !== undefined){
            stream.write(response.locals.append,sender)
        }else{
            sender()
        }
    }else{
        if(response.statusCode === 200){
            response.status(204)
        }
        response.end()
    }
}

/**
 * Sends the user an error depending on what required fields they missed or what fields they added that weren't needed, and lists the optional fields.
 * @param requiredFields The fields that the calling function needs a request to have.
 * @param optionalFields The fields that can be present in the calling function, but are not required.
 * @param response The Express response object used to reply to the user.
 * @param endpoint The endpoint that triggered the error.
 */
function checkRequest(request: Request, response: Response, next: () => void, schema: RequestSchema): void {
    schema = {body: schema.body === undefined ? Joi.object({}) : schema.body, query: schema.query === undefined ? Joi.object({}) : schema.query}
    if(schema.body !== undefined){
        const { error } = schema.body.validate(request.body,{dateFormat: "utc"})
        if(error !== undefined){
            response.status(400)
            response.send(`Invalid body: ${error.message}`)
            return
        }
    }
    if(schema.query !== undefined){
        const {error} = schema.query.validate(request.query,{dateFormat: "utc"})
        if(error !== undefined){
            response.status(400)
            response.send(`Invalid query string: ${error.message}`)
            return
        }
    }
    next()
}

interface Responder{
    method: "get" | "put" | "post" | "delete"
    process: processor<any,any,any,any> //eslint-disable-line
    schema: RequestSchema   
}

/**Constructs an Express object from a list of Endpoint objects that executes checkRequest on the endpoints' schemas, their processors, and then send for each endpoint.  
 * @param ip The URL to the desired Graphdb server
 * @param repo The graphdb repository to interact with
 * @param prefixes The prefixes to use in SPARQL queries
 * @param endpoints The endpoints of this server
 * @param log Whether or not to log requests to the console.
 * @returns an Express object that will host the desired Endpoint objects.
 */
export default function getApp<E extends Endpoint<any,any,any,any> = Endpoint<any,any,any,any>>(ip: string, repo: string, prefixes: Array<[string, string]>, endpoints: Array<E>, log?: boolean): Express { //eslint-disable-line
    const app = express()
    //Use the morgan logging library to log requests if desired
    if (log) {
        app.use(morgan("combined"))
    }

    //Use the json body parser
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    
    //Map the various routes to endpoints
    const routes = new Map<string, Responder[]>()
    for (const endpoint of endpoints) {
        const route = routes.get(endpoint.route)
        if(route !== undefined){
            route.push({...endpoint})
        }else{
            routes.set(endpoint.route,[{...endpoint}])
        }
    }

    //Use express.Router to set the possible methods at each route
    const router = express.Router()
    for(const entry of routes.entries()){
        const route = router.route(entry[0])
        for(const responder of entry[1]){
            route[responder.method]((request: Request, response: Response, next: () => void) => {
                checkRequest(request,response,next,responder.schema)
            })
            const handler = (request: Request, response: Response, next: (e?: Error) => void) => {
                responder.process(request,response,next,ip,repo,prefixes)
            }
            route[responder.method](handler)
            route[responder.method](send)
            if(responder.method == "get"){
                route.head(handler)
                route.head(send)
            }
        }
    }
    app.use("/",router)
    return app
}






