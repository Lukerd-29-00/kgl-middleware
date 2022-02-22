import { Request, Response } from "express"
import Joi from "joi"
import { Logger } from "winston"
import { EmptyObject, Endpoint, Locals, Method, RawData } from "../server"
import {v4 as uuid} from "uuid"
import startTransaction from "../util/transaction/startTransaction"
import { BodyAction, BodyLessAction, execTransaction } from "../util/transaction/execTransaction"

const route = "/writeToLearnerRecord"

const bodySchema = Joi.object({
    timestamp: Joi.number().integer().required().unit("milliseconds"),
    correct: Joi.boolean().required(),
    userID: Joi.string().required(),
    standardLearnerContent: Joi.string().required()
})

interface ReqBody extends Record<string,RawData>{
    timestamp: number,
    correct: boolean,
    userID: string,
    standardLearnerContent: string
}

function getTriples(userID: string, content: string, timestamp: number, correct: boolean): string{
    const id = uuid()
    const person = `cco:Person_${userID}`
    const act = `cco:Act_Learning_${id}`
    const timeNominal = `cco:Reference_Time_Act_Learning_${id}`
    const correctNominal = `cco:Correct_Nominal_Act_Learning_${id}`
    //Person
    let rawTriples = `${person} a cco:Person ;`
    rawTriples += `cco:agent_in ${act} .`
    //Act of Learning
    rawTriples += `${act} a cco:ActOfEducationalTrainingAcquisition ;`
    rawTriples += `cco:has_agent ${person} ;`
    rawTriples += `cco:has_object <${content}> ;`
    rawTriples += `cco:occurs_on ${timeNominal} ;`
    rawTriples += `cco:is_measured_by_nominal ${correctNominal} .`
    //Time Stamp
    rawTriples += `${timeNominal} a cco:ReferenceTime ;`
    rawTriples += `cco:is_tokenized_by "${timestamp}"^^xsd:integer .`
    //Correctness
    rawTriples += `${correctNominal} a cco:NominalMeasurementInformationContentEntity ;`
    rawTriples += `cco:is_tokenized_by "${correct}"^^xsd:boolean .`

    return rawTriples
}

async function processWriteToLearnerRecord(request: Request<EmptyObject,string,ReqBody,EmptyObject,EmptyObject>,response: Response<string,Locals>,next: (err?: Error) => void, ip: string, repo: string, log: Logger | null, prefixes: [string, string][]): Promise<void>{
    const location = await startTransaction(ip,repo)
    execTransaction(BodyAction.UPDATE,location,prefixes,getTriples(request.body.userID,request.body.standardLearnerContent,request.body.timestamp,request.body.correct)).then(() => {
        return execTransaction(BodyLessAction.COMMIT,location).then(() => {
            response.locals.stream.end()
            next()
        })
    }).catch(e => {
        next(e)
    })
}

const endpoint: Endpoint<EmptyObject,string,ReqBody,EmptyObject,Locals> = {
    method: Method.POST,
    route,
    process: processWriteToLearnerRecord,
    schema: {body: bodySchema}
}

export default endpoint