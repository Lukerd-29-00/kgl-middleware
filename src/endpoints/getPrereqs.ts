import { execTransaction, BodyAction, BodyLessAction } from "../util/transaction/execTransaction"
import startTransaction from "../util/transaction/startTransaction"
import rollback from "../util/transaction/rollback"
import  { createInterface, Interface } from "readline"
import {Request, Response} from "express"
import { LengthTrackingDuplex } from "../util/streams/PassThroughLength"
import { EmptyObject, Endpoint, Locals, Method } from "../server"
import SparqlQueryGenerator from "../util/QueryGenerators/SparqlQueryGenerator"
import { Logger } from "winston"
import Joi from "joi"
const route = "/content/:content/prerequisites"

interface ReqParams extends Record<string,string>{
    content: string
}

export function extractLines(lines: Interface, writeTo: LengthTrackingDuplex): void{
    let firstLine = true
    let secondLine = true
    writeTo.write("[")
    lines.on("line",line => {
        if(firstLine){
            firstLine = false
            return
        }
        if(!secondLine){
            writeTo.write(",")
        }else{
            secondLine = false
        }
        const {error} = Joi.string().uri().required().validate(encodeURI(line))
        if(error !== undefined){
            writeTo.emit("error",Error(`Graphdb sent back an invalid string: ${error.message}`))
            lines.close()
            return
        }
        writeTo.write(`"${line}"`)

    })
    lines.once("close",() => {
        writeTo.end("]")
    })
}

async function processGetPrereqs(request: Request<ReqParams,string,EmptyObject,EmptyObject>, response: Response<string,Locals>, next: (err?: Error) => void, ip: string, repo: string, log: Logger | null, prefixes: [string, string][]): Promise<void>{
    const location = await startTransaction(ip, repo).catch(e => {
        next(e)
    })
    if(location === undefined){
        return
    }
    const query = SparqlQueryGenerator({query: `<${request.params.content}> cco:has_part ?o`, targets: ["?o"]},prefixes)
    const res = await execTransaction(BodyAction.QUERY,location,prefixes,query).catch(e => {
        rollback(location).then(() => {
            next(e)
        }).catch(e => {
            next(e)
        })
    })
    if(res === undefined){
        return
    }
    execTransaction(BodyLessAction.COMMIT,location).catch(e => {
        if(log){
            log.error("error: ", {message: e.message})
        }
        rollback(location).catch(e => {
            if(log){
                log.error("error: ",{message: e.message})
            }
        })
    })
    response.header("Content-Type","application/json")
    const rl = createInterface(res.body)
    extractLines(rl,response.locals.stream)
    next()
}

const endpoint: Endpoint<ReqParams,string,EmptyObject,EmptyObject,Locals> = {
    process: processGetPrereqs,
    route,
    method: Method.GET,
    schema: {}
}
export default endpoint