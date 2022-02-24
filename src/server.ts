// We should add some way to verify who the request is coming from; there needs to be some kind of authentication to stop people from messing with each others' accounts!
/**
 *  Middleware software For Knowledge Apps and Leaners Models
 *  Knowledge Graphs For learners 
 *  Casey Rock 
 *  July 30, 2021
 */
import express, { Express, Handler, Request, Response } from "express"
import winston from "winston"
import Joi, { Schema } from "joi"
import PassThroughLength, { LengthTrackingDuplex } from "./util/streams/PassThroughLength"
import events from "events"

export type plainOrArrayOf<T> = Array<T> | T
export type RawData = number | boolean | string
export type Optional<T> = T | undefined
export type EmptyObject = Record<string,undefined>

export enum Method{
    GET = "get",
    PUT = "put",
    DELETE = "delete",
    POST = "post"
}

/**This is a specific type of middleware, intended to retrieve the desired data or write it to the database. Places the data into a PassThrough stream under response.locals.stream, the number of bytes in the stream under response.locals.length, and any characters to be added to the stream before reading in the response.locals.append variable. */
type processor<
    P extends Record<string,string> | EmptyObject,
    S extends plainOrArrayOf<RawData | Record<string,RawData>> | EmptyObject,
    R extends plainOrArrayOf<RawData | Record<string, Optional<RawData>>> | EmptyObject,
    Q extends Record<string,Optional<RawData>> | EmptyObject,
    L extends Locals
> 
= ((request: Request<P,S,R,Q>, response: Response<S,L>,next: (e?: Error) => void, ip: string, repo: string, log: winston.Logger | null, prefixes: Array<[string, string]>) => Promise<void>) 
| ((request: Request<Record<string,P>,S,R,Record<string,Q>>, response: Response<S,L>, next: (e?: Error) => void, ip: string, repo: string, log: winston.Logger | null) => Promise<void>)

/**This holds all the data required to determine what to do if a user queries the route field */
export interface Endpoint<
    P extends Record<string,string> | EmptyObject,
    S extends plainOrArrayOf<RawData | Record<string,RawData>> | EmptyObject,
    R extends plainOrArrayOf<Record<string, Optional<RawData>>> | EmptyObject,
    Q extends Record<string,Optional<RawData>> | EmptyObject,
    L extends Locals
>{
    schema: RequestSchema,
    route: string,
    method: Method,
    process: processor<P,S,R,Q,L>
}

export interface Locals{
    stream: LengthTrackingDuplex
}

interface RequestSchema{
    query?: Schema,
    body?: Schema
}

/**Sends a response that has been pre-processed by a processor (see above). Always ends the response. The response should not be ended before this function is called.
 * @param request The original request
 * @param response The response to send back
 */
async function send(request: Request, response: Response<any,Locals>): Promise<void>{ //eslint-disable-line
    if(response.locals.stream === undefined){
        throw Error("Error: response text must be placed into a readable stream in response.locals.stream!")
    }
    const stream = response.locals.stream as LengthTrackingDuplex
    let length = 0
    if(response.statusCode === 202 || response.statusCode === 204){
        response.locals.stream.end()
    }
    if(!stream.writableEnded){
        await events.once(response.locals.stream,"finish")
    }
    length = stream.bytesWritten
    if(length){
        if(request.method === "HEAD"){
            response.status(204)
        }
        response.setHeader("Content-Length",length)
        response.locals.stream.pipe(response)
    }else{
        if(request.method === "GET"){
            response.status(204)
        }else{
            response.status(202)
        }
        response.locals.stream.destroy()
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
function checkRequest(request: Request, response: Response<unknown,Locals>, next: (e?: Error) => void, schema: RequestSchema): void {
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
    response.locals.stream = new PassThroughLength()
    response.locals.stream.once("error",(e: Error) => {
        next(e)
    })
    next()
}

interface Responder{
    method: Method
    //Any is used here because the getApp function doesn't do any input validation or request handling, so it doesn't need to worry about the types of the input at all.
    process: processor<any,any,any,any,any> //eslint-disable-line
    schema: RequestSchema   
}

export interface Logger{
    middleware?: Handler
    main: winston.Logger
}

/**Constructs an Express object from a list of Endpoint objects that executes checkRequest on the endpoints' schemas, their processors, and then send for each endpoint.  
 * @param ip The URL to the desired Graphdb server
 * @param repo The graphdb repository to interact with
 * @param prefixes The prefixes to use in SPARQL queries
 * @param endpoints The endpoints of this server
 * @param log Whether or not to log requests to the console.
 * @returns an Express object that will host the desired Endpoint objects.
 */
export default function getApp<E extends Endpoint<any,any,any,any,L> = Endpoint<any,any,any,any,Locals>, L extends Locals = Locals>(ip: string, repo: string, prefixes: Array<[string, string]>, endpoints: Array<E>, log?: Logger): Express { //eslint-disable-line
    const app = express()
    //Use the morgan logging library to log requests if desired
    

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
            route[responder.method]((request: Request, response: Response<unknown,Locals>, next: () => void) => {
                checkRequest(request,response,next,responder.schema)
            })
            const handler = (request: Request, response: Response, next: (e?: Error) => void) => {
                responder.process(request,response,next,ip,repo,log === undefined ? null : log.main,prefixes)
            }
            route[responder.method](handler)
            route[responder.method](send)
            if(responder.method == Method.GET){
                route.head((request,response: Response<unknown,Locals>,next) => {
                    checkRequest(request,response,next,responder.schema)
                })
                route.head(handler)
                route.head(send)
            }
        }
    }
    if (log && log.middleware) {
        app.use(log.middleware)
    }
    app.use("/",router)
    app.use((err: Error, request: Request, response: Response, next: (err?: Error) => void) => {
        response.locals.stream.destroy()
        next(err)
    })
    app.disable("x-powered-by")
    return app
}






