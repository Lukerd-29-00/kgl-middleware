import endpoints from "../src/endpoints/endpoints"
import getApp from "../src/server"
import {ip} from "../src/config"
import supertest from "supertest"
import writeToLearnerRecord from "../src/endpoints/writeToLearnerRecord"
import startTransaction from "../src/util/transaction/startTransaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import SparqlQueryGenerator from "../src/util/QueryGenerators/SparqlQueryGenerator"
import {Transaction} from "../src/util/transaction/Transaction"
import fetch from "node-fetch"

async function expectContent(userID: string, contentIRI: string, timestamp: number, correct: boolean): Promise<void>{
    const location = await startTransaction(ip, "test")
    const content = contentIRI.replace("http://www.ontologyrepository.com/CommonCoreOntologies/","")
    let queryString = `cco:Person_${userID} rdf:type ?p ;`
    queryString += `cco:agent_in cco:Act_Learning_${content}_${timestamp}_Person_${userID} .`
    queryString += `cco:Act_Learning_${content}_${timestamp}_Person_${userID} rdf:type cco:ActOfEducationalTrainingAcquisition ;`
    queryString += `cco:has_object <${contentIRI}> ;`
    queryString += `cco:is_measured_by_nominal cco:${content}_${timestamp}_Nominal_Person_${userID} .`
    queryString += `cco:${content}_${timestamp}_Nominal_Person_${userID} rdf:type ?n ;`
    queryString += `cco:is_tokenized_by "${correct}"^^xsd:boolean .`
    let output = ""
    const start = new Date().getTime()
    while(output.match(/Person/) === null){
        const transaction: Transaction = {subj: null, pred: null, obj: null, action: "QUERY", body: SparqlQueryGenerator({query: queryString, targets: ["?p"]},[["cco","http://www.ontologyrepository.com/CommonCoreOntologies/"],["xsd","http://www.w3.org/2001/XMLSchema#"],["rdf","http://www.w3.org/1999/02/22-rdf-syntax-ns#"]]), location: location}
        output = await ExecTransaction(transaction)
        if(new Date().getTime() - start >= 120000){
            throw Error(`Could not find the request for ${userID} to add ${correct ? "a successful" : "a failed"} ${contentIRI} event at ${timestamp}. Make sure graphdb is responding!`)
        }
    }
    await commitTransaction(location)
}

describe("writeToLearnerRecord", () => {
    const app = getApp(ip,"test",[],endpoints)
    it("Should allow you to say that a person got something right", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
        const timestamp = new Date().getTime()
        const correct = true
        const body = {userID: userID, standardLearnedContent: content, timestamp: timestamp, correct: correct}
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).send(body)
        await expectContent(userID,content,timestamp,correct)
    })

    it("Should allow you to say that a person got something wrong", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
        const timestamp = new Date().getTime()
        const correct = false
        const body = {userID: userID, standardLearnedContent: content, timestamp: timestamp, correct: correct}
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).send(body)
        await expectContent(userID,content,timestamp,correct)
    })
    it("Should reject the request with a 400 error if any of the parameters is missing", async () => {
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).send({userID: "1234", standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", timestamp: "1234"}).expect(400)
        await test.put(writeToLearnerRecord.route).send({userID: "1234", standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", correct: true}).expect(400)
        await test.put(writeToLearnerRecord.route).send({userID: "1234", correct: true, timestamp: "1234"}).expect(400)
        await test.put(writeToLearnerRecord.route).send({correct: true, standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", timestamp: "1234"}).expect(400)
    })
    it("Should reject the request with a 400 error if any extra parameters are detected", async () => {
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).send({userID: "1234", standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", timestamp: "1234", correct: true, extra: false}).expect(400)
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/test/statements`,{
            method: "DELETE",
        })
    })
})
