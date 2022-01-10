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
import { Endpoints } from "./endpoints/endpoints"

type processor<P extends ParamsDictionary,S extends string | number | Object | undefined,R extends Record<string, string | number | boolean | undefined>,Q extends Query> = 
((request: Request<P,S,R,Q>, response: Response<S>, ip: string, repo: string, prefixes: Array<[string, string]>) => void) 
| ((request: Request, response: Response, ip: string, repo: string) => void)

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
    schema = {body: schema.body === undefined ? Joi.object() : {...schema.body}, query: schema.query === undefined ? Joi.object() : {...schema.query}} //Copies the schemas to make sure we don't overwrite the original schema, in case it is re-used elsewhere
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

export default function getApp<E extends Endpoint<any,any,any,any>>(ip: string, repo: string, prefixes: Array<[string, string]>, endpoints: Array<E>, log?: boolean): Express {
    const app = express()
    if (log) {
        app.use(morgan("combined"))
    }
    app.use(express.json())

    app.use(express.urlencoded({ extended: true }))

    for (const endpoint of endpoints) {
        app.use(endpoint.route, (request: Request, response: Response, next: () => void) => {
            checkRequest(request, response, next, endpoint.schema)
        })

        app[endpoint.method](endpoint.route, (request: Request, response: Response) => {
            endpoint.process(request, response, ip, repo, prefixes)
        })

    }

    return app
}






