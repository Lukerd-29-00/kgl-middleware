import { Request, Response } from "express"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import rollback from "../util/transaction/Rollback"
import commitTransaction from "../util/transaction/commitTransaction"
import Joi from "joi"
import { Endpoint } from "../server"

const schema = Joi.object({
    userID: Joi.string().required(),
    standardLearnedContent: Joi.string().required(),
    timestamp: Joi.number().required(),
    correct: Joi.boolean().required()
})

const route = "/writeToLearnerRecord"

export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, contentIRI: string, correct: boolean): string {
    let rawTriples = `cco:Person_${userID} rdf:type cco:Person ; \n`
    rawTriples += `\tcco:agent_in cco:Act_Learning_${content}_${timestamp}_Person_${userID} . \n\n`
    // Act of Learning
    rawTriples += `cco:Act_Learning_${content}_${timestamp}_Person_${userID} rdf:type cco:ActOfEducationalTrainingAcquisition ; \n`
    rawTriples += `\tcco:occurs_on cco:ReferenceTime_Act_Learning_${content}_${timestamp}_Person_${userID}; \n ` ///
    rawTriples += `\tcco:has_agent cco:Person_${userID}; \n `
    rawTriples += `\tcco:has_object <${contentIRI}>; \n `
    rawTriples += `\tcco:is_measured_by_nominal cco:${content}_${timestamp}_Nominal_Person_${userID} . \n\n`
    //Nominal 
    rawTriples += `cco:${content}_${timestamp}_Nominal_Person_${userID} rdf:type cco:NominalMeasurementInformationContentEntity ; \n `
    rawTriples += `\tcco:is_tokenized_by "${correct}"^^xsd:boolean .\n\n`
    //Time Stamp
    rawTriples += `cco:ReferenceTime_Act_Learning_${content}_${timestamp}_Person_${userID} rdf:type cco:ReferenceTime; \n `
    rawTriples += `\tcco:is_tokenized_by "${timestamp}"^^xsd:integer.\n\n`
    return rawTriples
}

async function processWriteToLearnerRecord(request: Request, response: Response, ip: string, repo: string, prefixes: Array<[string, string]>) {
    const userID = request.body.userID
    const content = request.body.standardLearnedContent.replace("http://www.ontologyrepository.com/CommonCoreOntologies/", "")
    const timestamp = request.body.timestamp
    const contentIRI = request.body.standardLearnedContent
    const correct = request.body.correct
    const triples = createLearnerRecordTriples(userID,content,timestamp,contentIRI,correct)
    writeToLearnerRecord(ip, repo, prefixes, triples)
        .then(() => {
            response.status(200)
            response.send("")
        })
        .catch((e: Error) => {
            response.status(500)
            response.send(e.message)
        })
}

async function writeToLearnerRecord(ip: string, repo: string, prefixes: Array<[string, string]>, triples: string): Promise<void> {
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {subj: null, pred: null, obj: null, body: triples, action: "UPDATE", location}
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

const endpoint: Endpoint = { method: "put", schema, route, process: processWriteToLearnerRecord }
export default endpoint