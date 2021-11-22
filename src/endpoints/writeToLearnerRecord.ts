import { Request, Response } from "express"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import {Transaction} from "../util/transaction/Transaction"
import rollback from "../util/transaction/Rollback"
import commitTransaction from "../util/transaction/commitTransaction"
import Joi from "joi"
import { Endpoint } from "../server"

const schema = Joi.object({
    userID: Joi.string(),
    standardLearnedContent: Joi.string(),
    timestamp: Joi.number(),
    correct: Joi.boolean()
})

const route = "/writeToLearnerRecord"

async function processWriteToLearnerRecord(request: Request, response: Response, ip: string, repo: string) {
    
    const userID = request.body.userID
    const content = request.body.standardLearnedContent.replace("http://www.ontologyrepository.com/CommonCoreOntologies/", "")
    const timestamp = request.body.timestamp
    const contentIRI = request.body.standardLearnedContent
    const correct = request.body.correct

    let rawTriples = `cco:Person_${userID} rdf:type cco:Person ;`
    rawTriples += `cco:agent_in cco:Act_Learning_${content}_${timestamp}_Person_${userID} .`
    rawTriples += `cco:Act_Learning_${content}_${timestamp}_Person_${userID} rdf:type cco:ActOfEducationalTrainingAcquisition ;`
    rawTriples += `cco:has_object <${contentIRI}> ;`
    rawTriples += `cco:is_measured_by_nominal cco:${content}_${timestamp}_Nominal_Person_${userID} .`
    rawTriples += `cco:${content}_${timestamp}_Nominal_Person_${userID} rdf:type cco:NominalMeasurementInformationContentEntity ;`
    rawTriples += `cco:is_tokenized_by "${correct}"^^xsd:boolean .`
    await writeToLearnerRecord(ip, repo, rawTriples).then(() => {
        response.send("Successfully wrote triples!")
    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })
}

async function writeToLearnerRecord(ip: string, repo: string, triples: string): Promise<void> {
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {action: "UPDATE", location: location, subj: null, pred: null, obj: null, body: triples}
    return await ExecTransaction(transaction).then(() => {
        commitTransaction(location).then(() => {
            return
        }).catch((e: Error) => {
            rollback(location)
            throw Error(`Failed to commit transaction: ${e.message}`)
        })

    }).catch((e) => {
        rollback(location)
        throw Error(`Could not write to triple store: ${e.message}`)
    })
}

const endpoint: Endpoint = {method: "put", schema: schema, route: route, process: processWriteToLearnerRecord}
export default endpoint