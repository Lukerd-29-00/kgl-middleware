import endpoints from "../src/endpoints/endpoints"
import getApp from "../src/server"
import {ip, prefixes} from "../src/config"
import supertest from "supertest"
import writeToLearnerRecord, {createLearnerRecordTriples} from "../src/endpoints/writeToLearnerRecord"
import startTransaction from "../src/util/transaction/startTransaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import SparqlQueryGenerator from "../src/util/QueryGenerators/SparqlQueryGenerator"
import {Transaction} from "../src/util/transaction/Transaction"
import fetch from "node-fetch"

const repo = "writeToLearnerRecordTest"

async function expectContent(userID: string, contentIRI: string, timestamp: number, correct: boolean, expectedTotal: number, expectedCorrect: number, prefixes: [string, string][]): Promise<void>{
    const location = await startTransaction(ip, repo)
    const content = contentIRI.replace("http://www.ontologyrepository.com/CommonCoreOntologies/","")
    const queryString = createLearnerRecordTriples(userID,content.replace("http://www.ontologyrepository.com/CommonCoreOntologies/", ""),timestamp,contentIRI,correct,expectedTotal,expectedCorrect).replace("cco:Person ;","?p ;")
    let output = ""
    while(output.match(/Person/) === null){
        const transaction: Transaction = {subj: null, pred: null, obj: null, action: "QUERY", body: SparqlQueryGenerator({query: queryString, targets: ["?p"]},prefixes), location: location}
        output = await ExecTransaction(transaction, prefixes)
    }
    await commitTransaction(location)
}

describe("writeToLearnerRecord", () => {
    const app = getApp(ip,repo,prefixes,endpoints)
    it("Should allow you to say that a person got something right", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
        const timestamp = new Date().getTime()
        const correct = true
        const body = {userID, standardLearnedContent: content, timestamp, correct}
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).set("Content-Type", "application/json").send(body).expect(200)
        await expectContent(userID,content,timestamp,correct,1,1,prefixes)
    }) 
    it("Should allow you to say that a person got something wrong", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent2"
        const timestamp = new Date().getTime()
        const correct = false
        const body = {userID: userID, standardLearnedContent: content, timestamp: timestamp, correct: correct}
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).send(body).expect(200)
        await expectContent(userID,content,timestamp,correct,1,0,prefixes)
    })
    it("Should reject the request with a 400 error if any of the parameters is missing", async () => {
        const test = supertest(app)
        const promises = [test.put(writeToLearnerRecord.route).send({userID: "1234", standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", timestamp: "1234"}).expect(400)]
        promises.push(test.put(writeToLearnerRecord.route).send({userID: "1234", standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", correct: true}).expect(400))
        promises.push(test.put(writeToLearnerRecord.route).send({userID: "1234", correct: true, timestamp: "1234"}).expect(400))
        promises.push(test.put(writeToLearnerRecord.route).send({correct: true, standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", timestamp: "1234"}).expect(400))
        await Promise.all(promises)
    })
    it("Should reject the request with a 400 error if any extra parameters are detected", async () => {
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).send({userID: "1234", standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", timestamp: "1234", correct: true, extra: false}).expect(400)
    })
    it("Should reject the request with a 400 error if the wrong data type is provided for a parameter", async () => {
        const test = supertest(app)
        const promises = [test.put(writeToLearnerRecord.route).send({userID: "1234", standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", timestamp: "time", correct: true}).expect(400)]
        promises.push(test.put(writeToLearnerRecord.route).send({userID: "1234", standardLearnedContent: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent", timestamp: "1234", correct: "yup"}).expect(400))
        await Promise.all(promises)
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`,{
            method: "DELETE",
        })
    })
})
