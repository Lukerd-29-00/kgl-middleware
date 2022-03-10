import { EmptyObject, Locals, Method, Endpoint } from "../server"
import {Request, Response} from "express"
import startTransaction from "../util/transaction/startTransaction"
import { BodyAction, BodyLessAction, execTransaction } from "../util/transaction/execTransaction"
import { getPrefixes } from "../util/QueryGenerators/SparqlQueryGenerator"
import rollback from "../util/transaction/rollback"
import { createInterface } from "readline"
import { extractLines } from "./getPrereqs"
import { Logger } from "winston"
import normalize from "../util/toURI"
import { ttlInstance } from "../server"
import Joi from "joi"

const route = "/content"

const querySchema = Joi.object({
    allowedClasses: Joi.alternatives(ttlInstance,Joi.array().items(ttlInstance)).optional()
})

interface ReqQuery{
    allowedClasses?: string[] | string
}

function getSubjectsQuery(prefixes: [string, string][], ...classes: string[]){
    let output = getPrefixes(prefixes)
    output += "select ?p where {"
    for(const ttlClass of classes){
        output += `{?p a <${ttlClass}> .} UNION `
    }
    output = output.replace(/ UNION $/,"")
    output += "}"
    return output
}

async function processGetSubjects(request: Request<EmptyObject,string,EmptyObject,ReqQuery,EmptyObject>, response: Response<string,Locals>, next: (err?: Error) => void, ip: string, repo: string, log: Logger | null, prefixes: [string, string][]): Promise<void>{
    let allowedClasses = new Array<string>()
    if(request.query.allowedClasses !== undefined){
        try{
            allowedClasses = [...new Set(normalize(request.query.allowedClasses,prefixes))]
        }catch(e){
            response.status(400)
            next(e as Error)
            return
        }
        
    }else{
        allowedClasses.push("http://www.w3.org/2002/07/owl#NamedIndividual")
    }
    startTransaction(ip, repo).then(location => {
        execTransaction(BodyAction.QUERY,location,prefixes,getSubjectsQuery(prefixes,...allowedClasses)).then(data => {
            execTransaction(BodyLessAction.COMMIT,location).catch(e => {
                rollback(location).then(() => {
                    if(log){
                        log.error("error: ", {message: e.message})
                    }
                }).catch(e => {
                    if(log){
                        log.error("error: ", {message: e.message})
                    }
                })
            })
            response.header("Content-Type","application/json")
            response.header("Transfer-Encoding","Chunked")
            response.header("Content-Encoding","gzip")
            const rl = createInterface(data.body)
            extractLines(rl,response.locals.stream)
            next()
        }).catch(e => {
            rollback(location).then(() => {
                next(e)
            }).catch(e => {
                next(e)
            })
        })
    }).catch(e => {
        next(e)
    })
}

const endpoint: Endpoint<EmptyObject,string,EmptyObject,EmptyObject,Locals> = {
    process: processGetSubjects,
    schema: {query: querySchema},
    route,
    method: Method.GET
}
export default endpoint