import { Request, Response } from "express"
import invalidBody from "./invalidBody"
import { defaultRepo, ip } from '../globals'
import startTransaction from "../api-commands/util/transaction/startTransaction"
import ExecTransaction from "../api-commands/util/transaction/ExecTransaction"
import {Transaction} from "../api-commands/util/transaction/Transaction"
import rollback from "../api-commands/util/transaction/Rollback"
import commitTransaction from "../api-commands/util/transaction/commitTransaction"

interface ReqBody {
    userID: string,
    standardLearnedContent: string,
    timestamp: number,
    correct: boolean
}
/**
 * Determines if the request for writing to a learner Record contains 
 * all the require elements 
 * 
 * @param body (object): Obj containing the information to updates a learner record 
 * @returns (boolean): Where or not the request contained all the required parts
 */
function isReqBody(body: Object): body is ReqBody {
    const entries = Object.entries(body)
    let output: boolean = (body as ReqBody).userID !== undefined
    for (let i = 0; output && i < entries.length; i += 1) {
        switch (entries[i][0]) {
            case "userID":
                break;
            case "standardLearnedContent":
                break;
            case "timestamp":
                break;
            case "correct":
                break;
            default:
                output = false;
                break;
        }
    }
    return output
}

async function processWriteToLearnerRecord(request: Request<{}, any, ReqBody>, response: Response) {
    if (!isReqBody(request.body)) {
        invalidBody(["userID", "standardLearnedContent", "timestamp", "correct"], [], response, "writeToLearnerRecord")
    }else {
        let userID = request.body.userID
        let content = request.body.standardLearnedContent.replace("http://www.ontologyrepository.com/CommonCoreOntologies/", '')
        let timestamp = request.body.timestamp
        let contentIRI = request.body.standardLearnedContent
        let correct = request.body.correct

        let rawTriples = `cco:Person_${userID} rdf:type cco:Person ;\n`
        rawTriples += `\tcco:agent_in cco:Act_Learning_${content}_${timestamp}_Person_${userID} .\n\n`
        rawTriples += `cco:Act_Learning_${content}_${timestamp}_Person_${userID} rdf:type cco:ActOfEducationalTrainingAcquisition ;\n`
        rawTriples += `\tcco:has_object <${contentIRI}> ;\n `
        rawTriples += `\tcco:is_measured_by_nominal ${content}_${timestamp}_Nominal_cco:Person_${userID} .\n\n`
        rawTriples += `\t${content}_${timestamp}_Nominal_cco:Person_${userID} rdf:type cco:NominalMeasurementInformationContentEntity ;\n `
        rawTriples += `\tcco:is_tokenized_by "${correct}"^^xsd:string .\n `
        await writeToLearnerRecord(rawTriples, userID).catch((e: Error) => {
            response.status(500);
            response.send(e.message);
        })
    }
}

async function writeToLearnerRecord(triples: string, userID: string): Promise<void> {
    const location = await startTransaction(defaultRepo)
    const transaction: Transaction = {action: "UPDATE", location: location, subj: null, pred: null, obj: null, body: triples}
    return await (ExecTransaction(transaction).then(() => {
        commitTransaction(location).then(() => {
            return;
        }).catch((e: Error) => {
            rollback(location).catch(() => {})
            throw Error(`Failed to commit transaction: ${e.message}`)
        })

    }).catch((e) => {
        rollback(location).catch(() => {});
        throw Error(`Could not write to triple store: ${e.message}`)
    }))
}

export default processWriteToLearnerRecord