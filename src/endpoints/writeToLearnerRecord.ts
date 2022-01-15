import { Request, Response } from "express"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import rollback from "../util/transaction/Rollback"
import commitTransaction from "../util/transaction/commitTransaction"
import Joi from "joi"
import { Endpoint } from "../server"
import {ParamsDictionary, Query} from "express-serve-static-core"
import {v4 as uuid} from "uuid"

const bodySchema = Joi.object({
    correct: Joi.boolean().required(),
    responseTime: Joi.when("correct",{
        is: Joi.boolean().valid(true),
        then: Joi.number().integer().unit("milliseconds").required(),
        otherwise: Joi.forbidden()
    })
})

const route = "/users/data/:userID/:content"

export interface ReqParams extends ParamsDictionary{
    userID: string
    content: string
}

export interface ReqBody extends Record<string, string | number | boolean | undefined>{
    responseTime: number,
    correct: boolean
}

export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, correct: false): string
export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, correct: true, responseTime: number): string
export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, correct: boolean, responseTime?: number): string {
    const id = uuid()
    const person = `cco:Person_${userID}`
    const act = `cco:Act_Learning_${id}`
    const timeNominal = `cco:Reference_Time_Act_Learning_${id}`
    const correctNominal = `cco:Correct_Nominal_Act_Learning_${id}`
    const responseTimeOrdinal = `cco:Response_Ordinal_Act_Learning_${id}`
    //Person
    let rawTriples = `${person} a cco:Person ;`
    rawTriples += `cco:agent_in ${act} .`
    //Act of Learning
    rawTriples += `${act} a cco:ActOfEducationalTrainingAcquisition ;`
    rawTriples += `cco:has_agent ${person} ;`
    rawTriples += `cco:has_object <${content}> ;`
    rawTriples += `cco:occurs_on ${timeNominal} ;`
    rawTriples += `cco:is_measured_by_nominal ${correctNominal} ;`
    rawTriples += `cco:is_measured_by_ordinal ${responseTimeOrdinal} .`
    //Time Stamp
    rawTriples += `${timeNominal} a cco:ReferenceTime ;`
    rawTriples += `cco:is_tokenized_by "${timestamp}"^^xsd:integer .`
    //Correctness
    rawTriples += `${correctNominal} a cco:NominalMeasurementInformationContentEntity ;`
    rawTriples += `cco:is_tokenized_by "${correct}"^^xsd:boolean .`
    //Response time
    if(correct){
        rawTriples += `${responseTimeOrdinal} a cco:OrdinalInformationContentEntity ;`
        rawTriples += `cco:is_tokenized_by "${responseTime}"^^xsd:integer .`
    }
    return rawTriples
}

async function processWriteToLearnerRecord(request: Request<ReqParams,string,ReqBody,Query>, response: Response<string>, ip: string, repo: string, prefixes: Array<[string, string]>) {
    const userID = request.params.userID
    let timestamp = new Date().getTime()
    if(request.headers.date !== undefined){
        timestamp = new Date(request.headers.date).getTime()
        if(isNaN(timestamp)){
            response.status(400)
            response.send("Malformed Date header")
            return
        }
    }
    const content = request.params.content
    const correct = request.body.correct
    const responseTime = request.body.responseTime
    let tmp2: undefined | string
    if(correct){
        tmp2 = createLearnerRecordTriples(userID, content, timestamp,true,responseTime)
    }else{
        tmp2 = createLearnerRecordTriples(userID, content, timestamp,false)
    }
    const triples = tmp2 as string
    writeToLearnerRecord(ip, repo, prefixes, triples)
        .then(() => {
            response.status(202)
            response.send("")
        })
        .catch((e: Error) => {
            response.status(500)
            response.send(e.message)
        })
}

async function writeToLearnerRecord(ip: string, repo: string, prefixes: Array<[string, string]>, triples: string): Promise<void> {
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = { subj: null, pred: null, obj: null, body: triples, action: "UPDATE", location }
    return new Promise<void>((resolve, reject) => {
        ExecTransaction(transaction, prefixes).then(() => {
            commitTransaction(location).then(() => {
                resolve()
            }).catch((e: Error) => {
                rollback(location).then(() => {
                    reject(`Failed to commit transaction: ${e.message}`)
                }).catch((err: Error) => {
                    reject(`Failed to roll back: ${err.message}\n\nAfter error: ${e.message}`)
                })
            })
        }).catch((e) => {
            rollback(location).then(() => {
                reject(`Could not write to triple store: ${e.message}`)
            }).catch((err: Error) => {
                reject(`Could not roll back: ${err.message}\n\nAfter error: ${e.message}`)
            })
        })
    })
}
const endpoint: Endpoint<ReqParams,string,ReqBody,Query> = { method: "put",schema: {body: bodySchema}, route, process: processWriteToLearnerRecord }
export default endpoint