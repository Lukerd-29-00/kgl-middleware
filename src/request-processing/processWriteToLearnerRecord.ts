import { Request, Response } from "express"
import invalidBody from "./invalidBody"
import { ip } from '../globals'

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

function processWriteToLearnerRecord(request: Request<{}, any, ReqBody>, response: Response) {
    if (!isReqBody(request.body)) {
        invalidBody("userID", "transactionID", response, "addPerson")
    } else {
        let userID = request.body.userID
        let content = request.body.standardLearnedContent.replace("http://www.ontologyrepository.com/CommonCoreOntologies/", '')
        let timestamp = request.body.timestamp
        let contentIRI = request.body.standardLearnedContent
        let correct = request.body.correct

        let rawTriples = `cco:Person_${userID} rdf:type cco:Person ; \n`
        rawTriples += `\tcco:agent_in cco:Act_Learning_${content}_${timestamp}_Person_${userID} . \n\n`
        rawTriples += `cco:Act_Learning_${content}_${timestamp}_Person_${userID} rdf:type cco:ActOfEducationalTrainingAcquisition ; \n`
        rawTriples += `\tcco:has_object <${contentIRI}>; \n `
        rawTriples += `\tcco:is_measured_by_nominal ${content}_${timestamp}_Nominal_cco:Person_${userID} . \n\n`
        rawTriples += `\t${content}_${timestamp}_Nominal_cco:Person_${userID} rdf:type cco:NominalMeasurementInformationContentEntity ; \n `
        rawTriples += `\tcco:is_tokenized_by "${correct}"^^xsd:String .  \n `
        console.log(rawTriples)
        // writeToLearnerRecord()
    }
}

function writeToLearnerRecord(encodedTriples: string, response: Response) {
    fetch(`${ip}/repositories/LearnerModels/statements?update=` + encodedTriples, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/rdf+xml',
        },
    }).then(response => response.text())
        .then(data => {
            response.send("Updated Learner Record")
        }).catch((error) => {
            response.send("Unable to Update Learner Record: " + error)
        });
}

// async function processWriteToLearnerRecord(request: Request<{}, any, ReqBody>, response: Response): Promise<void> {
//     if (!isReqBody(request.body)) {
//         invalidBody("userID", "transactionID", response, "addPerson")
//     } else {
//         await (addLearnerRecord(request.body.userID, Response).then((value) => {
//             response.send(value)
//         }).catch((e) => {
//             response.send(e.message)
//         }))
//     }
// }


export default processWriteToLearnerRecord