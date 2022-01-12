import { Request, Response } from "express"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import rollback from "../util/transaction/Rollback"
import commitTransaction from "../util/transaction/commitTransaction"
import Joi from "joi"
import { Endpoint } from "../server"
import {ParamsDictionary, Query} from "express-serve-static-core"

const bodySchema = Joi.object({
    correct: Joi.boolean().required(),
    responseTime: Joi.number().required()
})

const route = "/users/:userID/:content"

export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, correct: boolean, responseTime: number): string {
    const contentTerm = content.replace(/.*\/(?!\/)/, "")
    let rawTriples = `cco:Person_${userID} rdf:type cco:Person ; \n`
    rawTriples += `\tcco:agent_in cco:Act_Learning_${contentTerm}_${timestamp}_Person_${userID} . \n\n`
    // Act of Learning
    rawTriples += `cco:Act_Learning_${contentTerm}_${timestamp}_Person_${userID} rdf:type cco:ActOfEducationalTrainingAcquisition ; \n`
    rawTriples += `\tcco:occurs_on cco:ReferenceTime_Act_Learning_${contentTerm}_${timestamp}_Person_${userID}; \n ` ///
    rawTriples += `\tcco:has_agent cco:Person_${userID}; \n `
    rawTriples += `\tcco:has_object <${content}>; \n `
    rawTriples += `\tcco:is_measured_by_ordinal cco:${contentTerm}_${timestamp}_Response_Ordinal_Person_${userID} ; \n `
    rawTriples += `\tcco:is_measured_by_nominal cco:${contentTerm}_${timestamp}_Nominal_Person_${userID} . \n\n`
    //Correctness 
    rawTriples += `cco:${contentTerm}_${timestamp}_Nominal_Person_${userID} rdf:type cco:NominalMeasurementInformationContentEntity ; \n `
    rawTriples += `\tcco:is_tokenized_by "${correct}"^^xsd:boolean .\n\n`
    //Time Stamp
    rawTriples += `cco:ReferenceTime_Act_Learning_${contentTerm}_${timestamp}_Person_${userID} rdf:type cco:ReferenceTime; \n `
    rawTriples += `\tcco:is_tokenized_by "${timestamp}"^^xsd:integer.\n\n`
    //Response time
    rawTriples += `cco:${contentTerm}_${timestamp}_Response_Ordinal_Person_${userID} rdf:type cco:OrdinalInformationContentEntity ;\n`
    rawTriples += `cco:is_tokenized_by "${responseTime}"^^xsd:integer .`
    return rawTriples
}

interface ReqBody extends Record<string, string | number | boolean | undefined>{
    responseTime: number,
    correct: boolean
}

interface ReqParams extends ParamsDictionary{
    userID: string
    content: string
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
    const triples = createLearnerRecordTriples(userID, content, timestamp, correct,responseTime)
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