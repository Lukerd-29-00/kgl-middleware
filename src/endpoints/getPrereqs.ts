import { execTransaction, BodyAction, BodyLessAction } from "../util/transaction/execTransaction"
import startTransaction from "../util/transaction/startTransaction"
import rollback from "../util/transaction/rollback"
import readline from "readline"
import {Request, Response} from "express"
import { LengthTrackingDuplex } from "../util/streams/PassThroughLength"
import { EmptyObject, Endpoint, Locals, Method } from "../server"
import SparqlQueryGenerator from "../util/QueryGenerators/SparqlQueryGenerator"

const route = "/content/:content/prerequisites"

interface ReqParams extends Record<string,string>{
    content: string
}

async function queryPrerequisites(ip: string, repo: string, prefixes: [string, string][], target: string, writeTo: LengthTrackingDuplex): Promise<void>{
    const location = await startTransaction(ip, repo)
    const query = SparqlQueryGenerator({query: `<${target}> cco:has_part ?o`, targets: ["?o"]},prefixes)
    const res = await execTransaction(BodyAction.QUERY,location,prefixes,query).catch(e => {
        rollback(location).catch(e => {
            console.dir(e)
        })
        throw e
    })
    execTransaction(BodyLessAction.COMMIT,location).catch(() => {
        rollback(location).catch(e => {
            console.dir(e)
        })
    })
    const lines = readline.createInterface({input: res.body})
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
        writeTo.write(`"${line}"`)
    })
    lines.once("close",() => {
        writeTo.end("]")
    })
}

async function processGetPrereqs(request: Request<ReqParams,string,EmptyObject,EmptyObject>, response: Response<string,Locals>, next: (err?: Error) => void, ip: string, repo: string, prefixes: [string, string][]): Promise<void>{
    response.header("Content-Type","application/json")
    await queryPrerequisites(ip, repo, prefixes, request.params.content, response.locals.stream).catch(e => {
        next(e)
    })
    next()
}

const endpoint: Endpoint<ReqParams,string,EmptyObject,EmptyObject,Locals> = {
    process: processGetPrereqs,
    route,
    method: Method.GET,
    schema: {}
}
export default endpoint