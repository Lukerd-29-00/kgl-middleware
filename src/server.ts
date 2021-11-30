// We should add some way to verify who the request is coming from; there needs to be some kind of authentication to stop people from messing with each others' accounts!
/**
 *  Middleware software For Knowledge Apps and Leaners Models
 *  Knowledge Graphs For learners 
 *  Casey Rock 
 *  July 30, 2021
 */
import express, {Express, Request, Response} from "express"
import morgan from "morgan"
import Joi from "joi"

export interface Endpoint{
    schema: Joi.Schema,
    route: string,
    method: "put" | "post" | "delete" | "get",
    process: ((request: Request, response: Response, ip: string, repo: string, prefixes?: Array<[string, string]>) => void)
}

/**
 * Sends the user an error depending on what required fields they missed or what fields they added that weren't needed, and lists the optional fields.
 * @param requiredFields The fields that the calling function needs a request to have.
 * @param optionalFields The fields that can be present in the calling function, but are not required.
 * @param response The Express response object used to reply to the user.
 * @param endpoint The endpoint that triggered the error.
 */
function checkRequestBody(request: Request, response: Response, next: () => void, schema: Joi.Schema): void{
    const {error} = schema.validate(request.body)
    if(error === undefined){
        next()
    }else{
        response.status(400)
        response.send(error.message)
    }
}

export default function getApp(ip: string, repo: string, prefixes: Array<[string ,string]>, endpoints: Array<Endpoint>, log?: boolean): Express{
    const app = express()
    if(log){
        app.use(morgan("combined"))
    }
    app.use(express.json())

    app.use(express.urlencoded({ extended: true }))

    for(const endpoint of endpoints){
        app.use(endpoint.route, (request: Request, response: Response, next: () => void) => {
            checkRequestBody(request,response,next,endpoint.schema)
        })
        
        app[endpoint.method](endpoint.route, (request: Request, response: Response) => {
            endpoint.process(request, response, ip, repo, prefixes)
        })
        
    }

    return app
}






