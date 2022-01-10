import endpoints from "../src/endpoints/endpoints"
import getApp from "../src/server"
import { ip, prefixes } from "../src/config"
import supertest from "supertest"
import writeToLearnerRecord, { createLearnerRecordTriples } from "../src/endpoints/writeToLearnerRecord"
import startTransaction from "../src/util/transaction/startTransaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import SparqlQueryGenerator from "../src/util/QueryGenerators/SparqlQueryGenerator"
import { Transaction } from "../src/util/transaction/Transaction"
import fetch from "node-fetch"
import express from "express"
import { Server } from "http"
import { insertQuery } from "../src/util/transaction/insertQuery"
import getMockDB from "./mockDB"

const repo = "writeToLearnerRecordTest"
const port = 7203

function getNumberAttemptsQuery(userID: string, contentIRI: string, prefixes: [string, string][]): string{
    return SparqlQueryGenerator({query: `
        cco:Person_${userID} cco:agent_in ?p .
        ?p cco:has_object <${contentIRI}> ;
    		cco:is_measured_by_nominal / cco:is_tokenized_by ?c .
    `, targets: ["(count(?c) as ?x)"]},prefixes)
}
type ReqBody = {
    userID: string,
    content: string
}

async function getNumberAttempts(ip: string, repo: string, prefixes: [string, string][], request: ReqBody): Promise<number>{
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        location,
        body: getNumberAttemptsQuery(request.userID,request.content,prefixes),
        action: "QUERY"
    }

    return new Promise<number>((resolve, reject) => {
        ExecTransaction(transaction,prefixes).then((response: string) => {
            const match = response.match(/^(\d+)$/m)
            if(match !== null){
                resolve(parseInt(match[1],10))
            }else{
                reject()
            }
        }).catch((e: Error) => {
            reject(e.message)
        })
    })
}

function getNumberCorrectQuery(userID: string, contentIRI: string, prefixes: [string, string][]): string{
    return getNumberAttemptsQuery(userID,contentIRI,prefixes).replace("}","FILTER(?c=\"true\"^^xsd:boolean)\n}")
}

async function getNumberCorrectAttempts(ip: string, repo: string, prefixes: [string, string][], req: ReqBody): Promise<number>{
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        location,
        body: getNumberCorrectQuery(req.userID,req.content,prefixes),
        action: "QUERY"
    }

    return new Promise<number>((resolve, reject) => {
        ExecTransaction(transaction,prefixes).then((response: string) => {
            const match = response.match(/^(\d+)$/m)
            if(match !== null){
                resolve(parseInt(match[1],10))
            }else{
                reject()
            }
        }).catch((e: Error) => {
            reject(e.message)
        })
    })
}

async function expectContent(userID: string, content: string, timestamp: number, correct: boolean, prefixes: [string, string][]): Promise<void> {
    const location = await startTransaction(ip, repo)
    const queryString = createLearnerRecordTriples(userID, content, timestamp, correct).replace("cco:Person ;", "?p ;")
    let output = ""
    while (output.match(/Person/) === null) {
        const transaction: Transaction = { subj: null, pred: null, obj: null, action: "QUERY", body: SparqlQueryGenerator({ query: queryString, targets: ["?p"] }, prefixes), location: location }
        output = await ExecTransaction(transaction, prefixes)
    }
    await commitTransaction(location)
}

async function expectAttempts(attempts: number, userID: string, content: string, prefixes: [string, string][]): Promise<void> {
    while (await getNumberAttempts(ip, repo, prefixes, { userID, content }) !== attempts) {
        await new Promise((resolve) => {
            setTimeout(resolve, 100)
        })
    }
}

async function expectCorrect(attempts: number, userID: string, content: string, prefixes: [string, string][]): Promise<void> {
    while (await getNumberCorrectAttempts(ip, repo, prefixes, { userID, content }) !== attempts) {
        await new Promise((resolve) => {
            setTimeout(resolve, 100)
        })
    }
}

async function expectAnswers(correct: number, attempts: number, userID: string, content: string, prefixes: [string, string][]): Promise<void[]> {
    return Promise.all([
        expectAttempts(attempts, userID, content, prefixes),
        expectCorrect(correct, userID, content, prefixes)
    ])
}

describe("writeToLearnerRecord", () => {
    const app = getApp(ip, repo, prefixes, endpoints)
    it("Should allow you to say that a person got something right", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
        const timestamp = new Date().getTime()
        const correct = true
        const body = { userID, standardLearnedContent: content, timestamp, correct }
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).set("Content-Type", "application/json").send(body).expect(202)
        await Promise.all([
            expectAnswers(1, 1, userID, content, prefixes),
            expectContent(userID, content, timestamp, correct, prefixes)
        ])
    })
    it("Should allow you to say that a person got something wrong", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent2"
        const timestamp = new Date().getTime()
        const correct = false
        const body = { userID: userID, standardLearnedContent: content, timestamp: timestamp, correct: correct }
        const test = supertest(app)
        await test.put(writeToLearnerRecord.route).send(body).expect(202)
        await Promise.all([
            expectContent(userID, content, timestamp, correct, prefixes),
            expectAnswers(0, 1, userID, content, prefixes)
        ])
    })
    it("Should be able to handle several concurrent requests", async () => {
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
        const correct = true
        const timestamp1 = new Date().getTime()
        const body1 = { userID, standardLearnedContent: content, timestamp: timestamp1, correct }
        const timestamp2 = timestamp1 + 1
        const body2 = { userID, standardLearnedContent: content, timestamp: timestamp2, correct }
        const test = supertest(app)
        await Promise.all([
            test.put(writeToLearnerRecord.route).send(body1).expect(202),
            test.put(writeToLearnerRecord.route).send(body2).expect(202)
        ])
        await Promise.all([
            expectContent(userID, content, timestamp1, correct, prefixes),
            expectContent(userID, content, timestamp2, correct, prefixes),
            expectAnswers(2, 2, userID, content, prefixes)
        ])
    })
    it("Should send back a 400 error if the date header is malformed", async () => {
        const test = supertest(app)
        const userID = "1234"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
        const correct = true
        const timestamp = new Date().getTime()
        const body1 = {userID, content, correct, timestamp}
        const body2 = {userID, content, correct}
        await Promise.all([
            test.put(writeToLearnerRecord.route).set("Date",new Date().toUTCString() + "junk").send(body1).expect(400),
            test.put(writeToLearnerRecord.route).set("Date",new Date().toUTCString() + "junk").send(body2).expect(400)
        ])
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
    })
})

describe("writeToLearnerRecord", () => {
    let server: null | Server = null
    const mockIp=`http://localhost:${port}`
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
    it("Should send a server error if it cannot start a transaction", async () => {
        const test = supertest(getApp(mockIp, "blah", prefixes, endpoints))
        await test.put(writeToLearnerRecord.route).send(body).expect(500)
    })
    it("Should send a server error and attempt a rollback if it cannot execute a transaction", done => {
        const mockDB = getMockDB(mockIp,express(),repo,true,true,false)
        server = mockDB.server.listen(port, () => {
            const test = supertest(getApp(mockIp, repo, prefixes, endpoints))
            test.put(writeToLearnerRecord.route).send(body).expect(500)
            .then(() => {
                expect(mockDB.start).toHaveBeenCalled()
                expect(mockDB.rollback).toHaveBeenCalled()
                done()
            }).catch((e) => {
                done(e)
            })
        })
    })
    it("Should still send a server error if it fails the rollback", done => {
        const mockDB = getMockDB(mockIp,express(),repo,true,true,false,undefined,(request, response) => {
            response.status(500)
            response.send()
        })
        server = mockDB.server.listen(port, () => {
            const test = supertest(getApp(mockIp, repo, prefixes, endpoints))
            test.put(writeToLearnerRecord.route).send(body).expect(500)
            .then(() => {
                try{
                    expect(mockDB.start).toHaveBeenCalled()
                    expect(mockDB.rollback).toHaveBeenCalled()
                    done()
                }catch(e){
                    done(e)
                }
            }).catch((e) => {
                done(e)
            })
        })
    })
    it("Should send a server error and attempt a rollback if commiting the transaction fails", done => {
        const mockServer = express()
        mockServer.use(express.raw({type: "application/sparql-update"}))
        const mockDB = getMockDB(mockIp,mockServer,repo,true,true,true)
        server = mockDB.server.listen(port, () => {
            const test = supertest(getApp(mockIp, repo, prefixes, endpoints))
            test.put(writeToLearnerRecord.route).send(body).expect(500)
            .then(() => {
                try{
                    expect(mockDB.start).toHaveBeenCalled()
                    expect(mockDB.rollback).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalledWith(insertQuery(createLearnerRecordTriples(userID, content, timestamp, correct), prefixes),"UPDATE")
                    done()
                }catch(e){
                    done(e)
                }    
            }).catch((e) => {
                done(e)
            })
        })
    })
    it("Should still return the same error if the rollback fails after failing to commit", done => {
        const mockServer = express()
        mockServer.use(express.raw({ type: "application/sparql-update" }))
        const mockDB = getMockDB(mockIp,mockServer,repo,true,true,true,undefined,(request, response) => {
            response.status(500)
            response.send()
        })
        server = mockDB.server.listen(port, () => {
            const test = supertest(getApp(mockIp, repo, prefixes, endpoints))
            test.put(writeToLearnerRecord.route).send(body).expect(500)
            .then(() => {
                try{
                    expect(mockDB.start).toHaveBeenCalled()
                    expect(mockDB.rollback).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalledWith(insertQuery(createLearnerRecordTriples(userID, content, timestamp, correct), prefixes),"UPDATE")
                    done()
                }catch(e){
                    done(e)
                }
            }).catch((e) => {
                done(e)
            })
        })
    })
    afterEach(async () => {
        if (server) {
            await server.close()
        }
    })
})