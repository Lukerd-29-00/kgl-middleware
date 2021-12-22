import { Request, Response } from "express"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import rollback from "../util/transaction/Rollback"
import readLearnerCounts, { Result } from "../util/reads/readLearnerCounts"
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

export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, contentIRI: string, correct: boolean, totalCountValue: number, totalCorrectValue: number): string {
    let rawTriples = `cco:Person_${userID} rdf:type cco:Person ; \n`
    rawTriples += `\tcco:agent_in cco:Act_Learning_${content}_${timestamp}_Person_${userID} . \n\n`
    // Act of Learning
    rawTriples += `cco:Act_Learning_${content}_${timestamp}_Person_${userID} rdf:type cco:ActOfEducationalTrainingAcquisition ; \n`
    rawTriples += `\tcco:occurs_on cco:ReferenceTime_Act_Learning_${content}_${timestamp}_Person_${userID}; \n ` ///
    rawTriples += `\tcco:member_of cco:Act_Learning_${content}_Aggregate_Person_${userID}; \n `
    rawTriples += `\tcco:has_agent cco:Person_${userID}; \n `
    rawTriples += `\tcco:has_object <${contentIRI}>; \n `
    rawTriples += `\tcco:is_measured_by_nominal cco:${content}_${timestamp}_Nominal_Person_${userID} . \n\n`
    //Nominal 
    rawTriples += `cco:${content}_${timestamp}_Nominal_Person_${userID} rdf:type cco:NominalMeasurementInformationContentEntity ; \n `
    rawTriples += `\tcco:is_tokenized_by "${correct}"^^xsd:String .  \n\n`
    //Time Stamp
    rawTriples += `cco:ReferenceTime_Act_Learning_${content}_${timestamp}_Person_${userID} rdf:type cco:ReferenceTime; \n `
    rawTriples += `\tcco:is_tokenized_by "${timestamp}"^^xsd:Integer.\n\n`
    //Aggerate
    rawTriples += `cco:Act_Learning_${content}_Aggregate_Person_${userID} rdf:type cco:ActOfEducationalTrainingAcquisition; \n `
    rawTriples += `\tcco:is_measured cco:Act_Learning_${content}_TotalCount_Measurment_Person_${userID} ;\n`
    rawTriples += `\tcco:is_measured cco:Act_Learning_${content}_CountCorrect_Measurment_Person_${userID} ;\n`
    rawTriples += `\tcco:has_member cco:Act_Learning_${content}_${timestamp}_Person_${userID}.\n\n`
    //Total Count 
    rawTriples += `cco:Act_Learning_${content}_TotalCount_Measurment_Person_${userID} rdf:type cco:CountMeasurementInformationContentEntity ;\n `
    rawTriples += `cco:is_a_measurement_of cco:Act_Learning_${content}_Aggregate_Person_${userID} ;\n`
    rawTriples += `\tcco:is_tokenized_by "${totalCountValue}"^^xsd:Integer .\n\n`
    //Count Correct 
    rawTriples += `cco:Act_Learning_${content}_CountCorrect_Measurment_Person_${userID} rdf:type cco:CountMeasurementInformationContentEntity ;\n `
    rawTriples += `\tcco:is_a_measurement_of cco:Act_Learning_${content}_Aggregate_Person_${userID} ;\n`
    rawTriples += `\tcco:is_tokenized_by "${totalCorrectValue}"^^xsd:Integer .\n\n`
    //Learned Content Stasis
    rawTriples += `cco:Learned_Content_${content}_Stasis_Person_${userID} rdf:type cco:Stasis; \n `
    rawTriples += `\tcco:has_object cco:Act_Learning_${content}_Aggregate_Person_${userID} ;\n`
    rawTriples += `\tcco:is_measured cco:MasteryLevel_${content}_ProportionalRatioMeasurementICE_Person_${userID}  ;\n`
    rawTriples += "\tcco:occurs_on cco:ReferenceTime_Act_Learning_Phoneme_d_Grapheme-d-ICE_1634819280_Person_12NSNF_2IEHJFUEHA_21345SDG.\n\n"
    //Ratio Mastery
    rawTriples += `cco:MasteryLevel_${content}_ProportionalRatioMeasurementICE_Person_${userID} rdf:type cco:ProportionalRatioMeasurementInformationContentEntity; \n `
    rawTriples += `\tcco:is_tokenized_by "${totalCorrectValue / totalCountValue}"^^xsd:Decimal.\n\n`
    return rawTriples
}



async function processWriteToLearnerRecord(request: Request, response: Response, ip: string, repo: string, prefixes: Array<[string, string]>) {

    const userID = request.body.userID
    const content = request.body.standardLearnedContent.replace("http://www.ontologyrepository.com/CommonCoreOntologies/", "")
    const timestamp = request.body.timestamp
    const contentIRI = request.body.standardLearnedContent
    const correct = request.body.correct
    const totalCountIRI = `cco:Act_Learning_${content}_TotalCount_Measurment_Person_${userID}`
    const totalCorrectIRI = `cco:Act_Learning_${content}_CountCorrect_Measurment_Person_${userID}`
    readLearnerCounts(ip, repo, totalCountIRI, totalCorrectIRI, prefixes)
        .then((result: Result) => {
            const triples = createLearnerRecordTriples(userID, content, timestamp, contentIRI, correct, result.totalCount + 1, correct ? result.totalCorrect + 1 : result.totalCorrect)
            writeToLearnerRecord(userID, content, ip, repo, prefixes, triples, result.totalCount, correct ? result.totalCorrect : -1)
                .then(() => {
                    response.status(200).send({ data: "Udated Leaner Record " + userID })
                })
                .catch((e: Error) => {
                    response.status(500)
                    response.send(e.message)
                })
        })
        .catch((e: Error) => {
            response.status(500)
            response.send(e.message)
        })

}

async function writeToLearnerRecord(userID: string, content: string, ip: string, repo: string, prefixes: Array<[string, string]>, triples: string, totalCount: number, correctCount: number): Promise<void> {
    const location = await startTransaction(ip, repo)
    const updateTransaction: Transaction = { action: "UPDATE", location: location, subj: null, pred: null, obj: null, body: triples }
    const deleteTransaction: Transaction = {
        action: "DELETE", location: location, subj: null, pred: null, obj: null, body: `
        cco:Act_Learning_${content}_CountCorrect_Measurment_Person_${userID} cco:is_tokenized_by "${correctCount}"^^xsd:Integer .
        cco:Act_Learning_${content}_TotalCount_Measurment_Person_${userID} cco:is_tokenized_by "${totalCount}"^^xsd:Integer .`
    }
    await ExecTransaction(updateTransaction, prefixes).catch((e) => {
        rollback(location)
        throw Error(`Could not write to triple store: ${e.message}`)
    })

    return new Promise<void>((resolve, reject) => {
        ExecTransaction(deleteTransaction, prefixes).then(() => {
            commitTransaction(location).then(() => {
                resolve()
            }).catch((e: Error) => {
                rollback(location)
                reject(`Failed to commit transaction: ${e.message}`)
            })
        }).catch((e) => {
            rollback(location)
            reject(`Could not write to triple store: ${e.message}`)
        })
    })

}

const endpoint: Endpoint = { method: "put", schema, route, process: processWriteToLearnerRecord }
export default endpoint