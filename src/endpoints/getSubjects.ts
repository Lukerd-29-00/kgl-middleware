import { EmptyObject, Locals, Method, Endpoint } from "../server"
import {Request, Response} from "express"
import startTransaction from "../util/transaction/startTransaction"
import { BodyAction, BodyLessAction, execTransaction } from "../util/transaction/execTransaction"
import { getPrefixes } from "../util/QueryGenerators/SparqlQueryGenerator"
import rollback from "../util/transaction/rollback"
import { createInterface } from "readline"
import { extractLines } from "./getPrereqs"
import { Logger } from "winston"
const route = "/content"

function getSubjectsQuery(prefixes: [string, string][]){
    const output = getPrefixes(prefixes)
    return output +`select ?p where {
        ?p a owl:NamedIndividual .
    }`
}


async function processGetSubjects(request: Request<EmptyObject,string,EmptyObject,EmptyObject,EmptyObject>, response: Response<string,Locals>, next: (err?: Error) => void, ip: string, repo: string, log: Logger | null, prefixes: [string, string][]): Promise<void>{
    startTransaction(ip, repo).then(location => {
        execTransaction(BodyAction.QUERY,location,prefixes,getSubjectsQuery(prefixes)).then(data => {
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
            response.header("Content-Security-Policy", `default-src http://localhost:3000; script-src 'none'`)
            response.header("Access-Control-Allow-Origin", "http://localhost:3000")
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
    schema: {},
    route,
    method: Method.GET
}
export default endpoint