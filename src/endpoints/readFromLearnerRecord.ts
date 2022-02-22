import { Request, Response } from "express"
import { Logger } from "winston"
import { EmptyObject, Endpoint, Locals, Method } from "../server"
import { getPrefixes } from "../util/QueryGenerators/SparqlQueryGenerator"
import { LengthTrackingDuplex } from "../util/streams/PassThroughLength"
import { createInterface } from "readline"
import startTransaction from "../util/transaction/startTransaction"
import { BodyAction, BodyLessAction, execTransaction } from "../util/transaction/execTransaction"
import Joi from "joi"
const route = "/readFromLearnerRecord"

const bodySchema = Joi.object({
    userID: Joi.string().required()
})

interface ReqBody extends Record<string,string>{
    userID: string
}

function getReadQuery(userID: string, prefixes: [string, string][]): string{
    let output = getPrefixes(prefixes)
    output += `select ?content (SUM(?t) as ?correct) (COUNT(?t) as ?total) where { 
        cco:Person_${userID} cco:agent_in ?a .
            ?a cco:has_object ?content ;
                cco:is_measured_by_nominal / cco:is_tokenized_by ?c .
        BIND(IF(?c="true"^^xsd:boolean,1,0) as ?t)
    } GROUP BY ?content`
    return output
}

function parseReadOutput(writeTo: LengthTrackingDuplex, data: NodeJS.ReadableStream): void{
    const rl = createInterface(data)
    writeTo.write("{")
    rl.once("line",() => {
        rl.once("line",() => {
            rl.prependListener("line",() => {
                writeTo.write(",")
            })
        })
        rl.on("line",line => {
            const match = line.toString().match(/(.+),(.+),(.+)/)
            if(match === null){
                throw Error("error: invalid response from graphdb")
            }
            const correctCount = parseInt(match[2],10)
            const answerCount = parseInt(match[3],10)
            if(isNaN(answerCount) || isNaN(correctCount)){
                throw Error("error: invalid response from graphdb")
            }
            writeTo.write(`"${match[1]}": ${JSON.stringify({correct: correctCount, answers: answerCount})}`)
        })
    })
    rl.once("close",() => {
        writeTo.end("}")
    })
}

async function processReadFromLearnerRecord(request: Request<EmptyObject,string,ReqBody,EmptyObject,EmptyObject>,response: Response<string,Locals>, next: (err?: Error) => void, ip: string, repo: string, log: Logger | null, prefixes: [string, string][]): Promise<void>{
    const location = await startTransaction(ip,repo)
    response.setHeader("Content-Type","application/json")
    execTransaction(BodyAction.QUERY,location,prefixes,getReadQuery(request.body.userID,prefixes)).then(res => {
        res.body.once("error",e => {
            response.locals.stream.destroy()
            next(e)
        })
        execTransaction(BodyLessAction.COMMIT,location).catch(e => {
            if(log){
                log.error("error: ",{message: e.message})
            }
        })
        parseReadOutput(response.locals.stream,res.body)
        next()
    }).catch(e => {
        next(e)
    })
}

const endpoint: Endpoint<EmptyObject,string,ReqBody,EmptyObject,Locals> = {
    process: processReadFromLearnerRecord,
    route,
    method: Method.PUT,
    schema: {body: bodySchema}
}

export default endpoint