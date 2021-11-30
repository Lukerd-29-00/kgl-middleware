import { Request, Response } from "express"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import rollback from "../util/transaction/Rollback"
import readLearnerCounts from "../util/reads/readLearnerCounts"
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

function createLearnerRecordTriples(userID: string, content: string, timestamp: number, contentIRI: string, correct: Boolean, totalCountValue: number, totalCorrectValue: number, masteryRation: number): string {
    let rawTriples = `prefix cco: <http://www.ontologyrepository.com/CommonCoreOntologies/>\n`
    rawTriples += `cco:Person_${userID} rdf:type cco:Person ; \n`
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
    rawTriples += `cco:Act_Learning_${content}_TotalCount_Measurment_Person_${userID} rdf:type cco:CountMeasurementInformationContentEntity; \n `
    rawTriples += `\tcco:is_tokenized_by "${totalCountValue}"^^xsd:Integer .\n\n`
    //Count Correct 
    rawTriples += `cco:Act_Learning_${content}_CountCorrect_Measurment_Person_${userID} rdf:type cco:CountMeasurementInformationContentEntity; \n `
    rawTriples += `\tcco:is_tokenized_by "${totalCorrectValue}"^^xsd:Integer .\n\n`
    //Learned Content Stasis
    rawTriples += `cco:Learned_Content_${content}_Stasis_Person_${userID} rdf:type cco:Stasis; \n `
    rawTriples += `\tcco:has_object cco:Act_Learning_${content}_Aggregate_Person_${userID} ;\n`
    rawTriples += `\tcco:is_measured cco:MasteryLevel_${content}_ProportionalRatioMeasurementICE_Person_${userID}  ;\n`
    rawTriples += `\tcco:occurs_on cco:ReferenceTime_Act_Learning_Phoneme_d_Grapheme-d-ICE_1634819280_Person_12NSNF_2IEHJFUEHA_21345SDG.\n\n`
    //Ratio Mastery
    rawTriples += `cco:MasteryLevel_${content}_ProportionalRatioMeasurementICE_Person_${userID} rdf:type cco:ProportionalRatioMeasurementInformationContentEntity; \n `
    rawTriples += `\tcco:is_tokenized_by "${masteryRation}"^^xsd:Decimal.\n\n`
    return rawTriples
}



async function processWriteToLearnerRecord(request: Request, response: Response, ip: string, repo: string) {

    const userID = request.body.userID
    const content = request.body.standardLearnedContent.replace("http://www.ontologyrepository.com/CommonCoreOntologies/", "")
    const timestamp = request.body.timestamp
    const contentIRI = request.body.standardLearnedContent
    const correct = request.body.correct
    let totalCountIRI = `cco:Act_Learning_${content}_TotalCount_Measurment_Person_${userID}`
    let totalCorrectIRI = `cco:Act_Learning_${content}_CountCorrect_Measurment_Person_${userID}`
    readLearnerCounts(totalCountIRI, totalCorrectIRI, (result) => {
        if (result.success) {
            let totalCorrectValue
            let totalCountValue

            if (result.success) {
                if (correct)
                    totalCorrectValue = parseInt(result.totalCorrect) + 1
                else
                    totalCorrectValue = parseInt(result.totalCorrect)

                totalCountValue = parseInt(result.totalCount) + 1
            } else {
                if (correct)
                    totalCorrectValue = 1
                else
                    totalCorrectValue = 0

                totalCountValue = 1
            }
            let masteryRation = parseInt(result.totalCorrect) / parseInt(result.totalCount)
            let rawTriples = createLearnerRecordTriples(userID, content, timestamp, contentIRI, correct, totalCountValue, totalCorrectValue, masteryRation)
            writeToLearnerRecord(ip, repo, rawTriples).then(() => {
                response.send("Successfully wrote triples!")
            }).catch((e: Error) => {
                response.status(500)
                response.send(e.message)
            })
        } else {
            response.status(500).send("Could not write to the Learner Model")
        }

    })

}

async function writeToLearnerRecord(ip: string, repo: string, triples: string): Promise<void> {
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = { action: "UPDATE", location: location, subj: null, pred: null, obj: null, body: triples }
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

const endpoint: Endpoint = { method: "put", schema: schema, route: route, process: processWriteToLearnerRecord }
export default endpoint