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
import { getNumberAttempts } from "../src/endpoints/attempts"
import { getNumberCorrectAttempts } from "../src/endpoints/correct"
import express from "express"
import { Server } from "http"
import { insertQuery} from "../src/util/transaction/insertQuery"

const repo = "writeToLearnerRecordTest"

async function expectContent(userID: string, contentIRI: string, timestamp: number, correct: boolean, prefixes: [string, string][]): Promise<void>{
    const location = await startTransaction(ip, repo)
    const content = contentIRI.replace("http://www.ontologyrepository.com/CommonCoreOntologies/","")
    const queryString = createLearnerRecordTriples(userID,content.replace("http://www.ontologyrepository.com/CommonCoreOntologies/", ""),timestamp,contentIRI,correct).replace("cco:Person ;","?p ;")
    let output = ""
    while(output.match(/Person/) === null){
        const transaction: Transaction = {subj: null, pred: null, obj: null, action: "QUERY", body: SparqlQueryGenerator({query: queryString, targets: ["?p"]},prefixes), location: location}
        output = await ExecTransaction(transaction, prefixes)
    }
    await commitTransaction(location)
}

async function expectAttempts(attempts: number, userID: string, content: string, prefixes: [string, string][]): Promise<void>{
    while(await getNumberAttempts(ip,repo,userID,content,prefixes) !== attempts){
        await new Promise((resolve) => {
            setTimeout(resolve,100)
        })
    }
}

async function expectCorrect(attempts: number, userID: string, content: string, prefixes: [string, string][]): Promise<void>{
    while(await getNumberCorrectAttempts(ip,repo,userID,content,prefixes) !== attempts){
        await new Promise((resolve) => {
            setTimeout(resolve,100)
        })
    }
}

async function expectAnswers(correct: number, attempts: number, userID: string, content: string, prefixes: [string, string][]): Promise<void[]>{
    return Promise.all([
        expectAttempts(attempts,userID,content,prefixes),
        expectCorrect(correct,userID,content,prefixes)
    ])
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
        await Promise.all([
            expectAnswers(1,1,userID,content,prefixes),
            expectContent(userID,content,timestamp,correct,prefixes)
        ])
    }) 
    it("Should allow you to say that a person got something wrong", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent2"
        const timestamp = new Date().getTime()
        const correct = false
        const body = {userID: userID, standardLearnedContent: content, timestamp: timestamp, correct: correct}
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).send(body).expect(200)
        await Promise.all([
            expectContent(userID,content,timestamp,correct,prefixes),
            expectAnswers(0,1,userID,content,prefixes)
        ])
    })
    it("Should be able to handle several concurrent requests", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
        const correct = true
        const timestamp1 = new Date().getTime()
        const body1 = {userID, standardLearnedContent: content, timestamp: timestamp1, correct}
        const timestamp2 = timestamp1+1
        const body2 = {userID, standardLearnedContent: content, timestamp: timestamp2, correct}
        const test = supertest(app)
        await Promise.all([
            test.put(writeToLearnerRecord.route).send(body1).expect(200),
            test.put(writeToLearnerRecord.route).send(body2).expect(200)
        ])
        await Promise.all([
            expectContent(userID,content,timestamp1,correct,prefixes),
            expectContent(userID,content,timestamp2,correct,prefixes),
            expectAnswers(2,2,userID,content,prefixes)
        ])      
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

describe("writeToLearnerRecord", () => {
    let server: null | Server = null
    const userID = "1234"
    const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent2"
    const timestamp = new Date().getTime()
    const correct = false
    const body = {
        userID,
        standardLearnedContent: content,
        correct,
        timestamp
    }
    const mockTransaction = "ab642438bc4aacdvq"
    const transactions = `/repositories/${repo}/transactions`
    const location = `${transactions}/${mockTransaction}`
    it("Should send a server error if it cannot start a transaction", async () => {
        const test = supertest(getApp("http://localhost:7202","blah",prefixes,endpoints))
        await test.put(writeToLearnerRecord.route).send(body).expect(500)
    })
    it("Should send a server error and attempt a rollback if it cannot execute a transaction", done => {
        const mockStart = jest.fn<void, [void]>()
        const mockRollback = jest.fn<void, [void]>()
        const mockDB = express()
        mockDB.post(transactions,(request, response) => {
            mockStart()
            response.header({location: `http://localhost:7202${location}`})
            response.send("")
        })
        mockDB.delete(location, (request, response) => {
            mockRollback()
            response.send("")
        })
        server = mockDB.listen(7202, () => {
            const test = supertest(getApp("http://localhost:7202",repo,prefixes,endpoints))
            test.put(writeToLearnerRecord.route).send(body).expect(500).end(() => {
                expect(mockStart).toHaveBeenCalled()
                expect(mockRollback).toHaveBeenCalled()
                done()
            })
        })
    })
    it("Should still send a server error if it fails the rollback", done => {
        const mockStart = jest.fn<void, [void]>()
        const mockRollback = jest.fn<void, [void]>()
        const mockDB = express()
        mockDB.post(transactions,(request, response) => {
            mockStart()
            response.header({location: `http://localhost:7202${location}`})
            response.send("")
        })
        mockDB.delete(location, (request, response) => {
            mockRollback()
            response.status(500)
            response.send("")
        })
        server = mockDB.listen(7202, () => {
            const test = supertest(getApp("http://localhost:7202",repo,prefixes,endpoints))
            test.put(writeToLearnerRecord.route).send(body).expect(500).end(() => {
                expect(mockStart).toHaveBeenCalled()
                expect(mockRollback).toHaveBeenCalled()
                done()
            })
        })
    })
    it("Should send a server error and attempt a rollback if commiting the transaction fails", done => {
        const mockStart = jest.fn<void, [void]>()
        const mockRollback = jest.fn<void, [void]>()
        const mockExec = jest.fn<void, [string]>()
        const mockDB = express()
        mockDB.use(express.raw({type: "application/sparql-update"}))
        mockDB.post(transactions,(request, response) => {
            mockStart()
            response.header({location: `http://localhost:7202${location}`})
            response.send("")
        })
        mockDB.delete(location, (request, response) => {
            mockRollback()
            response.send("")
        })
        mockDB.put(`${location}`, (request, response) => {
            if(request.query.action === "UPDATE"){
                mockExec(request.body.toString())
                response.send("")
            }else{
                response.status(500)
                response.send("")
            }
        })
        server = mockDB.listen(7202, () => {
            const test = supertest(getApp("http://localhost:7202",repo,prefixes,endpoints))
            test.put(writeToLearnerRecord.route).send(body).expect(500).end(() => {
                expect(mockStart).toHaveBeenCalled()
                expect(mockRollback).toHaveBeenCalled()
                expect(mockExec).toHaveBeenCalled()
                expect(mockExec).toHaveBeenLastCalledWith(insertQuery(createLearnerRecordTriples(userID,content.replace(/.*\/(?!\/)/,""),timestamp,content,correct),prefixes))
                done()
            })
        })
    })
    it("Should still return the same error if the rollback fails after failing to commit", done => {
        const mockStart = jest.fn<void, [void]>()
        const mockRollback = jest.fn<void, [void]>()
        const mockExec = jest.fn<void, [string]>()
        const mockDB = express()
        mockDB.use(express.raw({type: "application/sparql-update"}))
        mockDB.post(transactions,(request, response) => {
            mockStart()
            response.header({location: `http://localhost:7202${location}`})
            response.send("")
        })
        mockDB.delete(location, (request, response) => {
            mockRollback()
            response.status(500)
            response.send("")
        })
        mockDB.put(`${location}`, (request, response) => {
            if(request.query.action === "UPDATE"){
                mockExec(request.body.toString())
                response.send("")
            }else{
                response.status(500)
                response.send("")
            }
        })
        server = mockDB.listen(7202, () => {
            const test = supertest(getApp("http://localhost:7202",repo,prefixes,endpoints))
            test.put(writeToLearnerRecord.route).send(body).expect(500).end(() => {
                expect(mockStart).toHaveBeenCalled()
                expect(mockRollback).toHaveBeenCalled()
                expect(mockExec).toHaveBeenCalled()
                expect(mockExec).toHaveBeenLastCalledWith(insertQuery(createLearnerRecordTriples(userID,content.replace(/.*\/(?!\/)/,""),timestamp,content,correct),prefixes))
                done()
            })
        })
    })
    afterEach(async () => {
        if(server){
            await server.close()
        }
    })
})