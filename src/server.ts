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

type processor<P extends ParamsDictionary,S extends string | number | Object | undefined,R extends Record<string, string | number | boolean | undefined>,Q extends Query> = 
((request: Request<P,S,R,Q>, response: Response<S>, ip: string, repo: string, prefixes: Array<[string, string]>) => Promise<void>) 
| ((request: Request, response: Response, ip: string, repo: string) => Promise<void>)

export interface Endpoint<P extends ParamsDictionary,S extends string | number | Object | undefined,R extends Record<string, string | number | boolean | undefined>,Q extends Query>{
    schema: RequestSchema,
    route: string,
    method: "put" | "post" | "delete" | "get",
    process: processor<P,S,R,Q>
}

interface RequestSchema{
    query?: Schema,
    body?: Schema
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
        const { error } = schema.body.validate(request.body)
        if(error !== undefined){
            response.status(400)
            response.send(`Invalid body: ${error.message}`)
            return
        }
    }
    if(schema.query !== undefined){
        const {error} = schema.query.validate(request.query)
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
    process: processor<any,any,any,any>
    schema: RequestSchema   
}

export default function getApp<E extends Endpoint<any,any,any,any>>(ip: string, repo: string, prefixes: Array<[string, string]>, endpoints: Array<E>, log?: boolean): Express {
    const app = express()
    if (log) {
        app.use(morgan("combined"))
    }
    app.use(express.json())

    app.use(express.urlencoded({ extended: true }))

    
    const routes = new Map<string, Responder[]>()

    for (const endpoint of endpoints) {
        const route = routes.get(endpoint.route)
        if(route !== undefined){
            route.push({...endpoint})
        }else{
            routes.set(endpoint.route,[{...endpoint}])
        }
    }

    const router = express.Router()
    for(const entry of routes.entries()){
        const route = router.route(entry[0])
        for(const responder of entry[1]){
            route[responder.method]((request: Request, response: Response, next: () => void) => {
                checkRequest(request,response,next,responder.schema)
            })
            route[responder.method]((request: Request, response: Response) => {
                responder.process(request,response,ip,repo,prefixes).catch((e: Error) => {
                    if(log){
                        console.log(e)
                    }
                })
            })
        }
    }
    app.use("/",router)

    return app
}






