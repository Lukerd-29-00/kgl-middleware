import endpoints from "../src/endpoints/endpoints"
import getApp from "../src/server"
import { ip, prefixes } from "../src/config"
import supertest from "supertest"
import writeToLearnerRecord from "../src/endpoints/writeToLearnerRecord"
import startTransaction from "../src/util/transaction/startTransaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import {getPrefixes} from "../src/util/QueryGenerators/SparqlQueryGenerator"
import { Transaction } from "../src/util/transaction/Transaction"
import fetch from "node-fetch"
import express from "express"
import { Server } from "http"
import getMockDB from "./mockDB"
import { queryWrite, waitFor } from "./util"

const repo = "writeToLearnerRecordTest"
const port = 7204

interface Resource{
    userID: string,
    content: string
}

interface Answer{
    correct: boolean,
    timestamp: number,
    responseTime?: number,
}

function findStatementQuery(location: Resource, statement: Answer): string{
    let output = getPrefixes(prefixes)
    output += `select ?a where {
        cco:Person_${location.userID} cco:agent_in ?a .
        ?a cco:has_object <${location.content}> ;
           cco:occurs_on / cco:is_tokenized_by "${statement.timestamp}"^^xsd:integer ;
           cco:is_measured_by_nominal / cco:is_tokenized_by "${statement.correct}"^^xsd:boolean ;`
    output += statement.correct ? `cco:is_measured_by_ordinal / cco:is_tokenized_by "${statement.responseTime}"^^xsd:integer .}` : "}"
    return output
}

function getFilter(statement: Answer): string{
    let output = `FILTER NOT EXISTS {
        ?a cco:occurs_on / cco:is_tokenized_by "${statement.timestamp}"^^xsd:integer ;
        cco:is_measured_by_nominal / cco:is_tokenized_by "${statement.correct}"^^xsd:boolean ;`
    output += statement.correct ? `cco:is_measured_by_ordinal / cco:is_tokenized_by "${statement.responseTime}"^^xsd:integer .}` : "}"
    return output
}

async function findUnexpectedStatements(location: Resource, statements: Answer[]): Promise<void>{
    let output = getPrefixes(prefixes)
    output += `select ?a where {
        cco:Person_${location.userID} cco:agent_in ?a .
        ?a cco:has_object <${location.content}> .`

    for(const answer of statements){
        output += getFilter(answer)
    }
    output += "}"
    const res = await makeQuery(output)
    expect(res).not.toMatch(/http:[\/]\/www.ontologyrepository.com\/CommonCoreOntologies\/Act_Learning/) //eslint-disable-line
}

async function makeQuery(body: string): Promise<string>{
    const transactionLocation = await startTransaction(ip, repo)
    const transaction: Transaction = {
        location: transactionLocation,
        subj: null,
        pred: null,
        obj: null,
        action: "QUERY",
        body
    }
    const res = await ExecTransaction(transaction,prefixes)
    await commitTransaction(transactionLocation)
    return res
}

async function expectStatement(location: Resource, expected: Answer): Promise<void>{
    const res = await makeQuery(findStatementQuery(location,expected))
    expect(res).toMatch(/http:[\/]\/www.ontologyrepository.com\/CommonCoreOntologies\/Act_Learning/) //eslint-disable-line
}

async function expectStatements(expected: Map<Resource, Answer[]>): Promise<void>{
    const promises = new Array<Promise<void>>()
    for(const entry of expected.entries()){
        promises.push(findUnexpectedStatements(entry[0],entry[1]))
        for(const answer of entry[1]){
            promises.push(expectStatement(entry[0],answer))
        }
    }
    await Promise.all(promises)
}

describe("writeToLearnerRecord", () => {
    const app = getApp(ip, repo, prefixes, endpoints)
    const userID = "1234"
    const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
    const responseTime = 100
    it("Should allow you to say that a person got something right", async () => {
        const time = new Date()
        const expected = new Map<Resource,Answer[]>()
        expected.set({userID,content},[{correct: true, responseTime, timestamp: new Date(time.toUTCString()).getTime()}])
        const test = supertest(app)
        await queryWrite(test,userID,content,time,true,responseTime)
        await waitFor(async () => {
            expectStatements(expected)
        })  
    })
    it("Should allow you to say that a person got something wrong", async () => {
        const time = new Date()
        const expected = new Map<Resource,Answer[]>()
        expected.set({userID,content},[{correct: false, timestamp: new Date(time.toUTCString()).getTime()}])
        const test = supertest(app)
        await queryWrite(test,userID,content,time,false)
        await waitFor(async () => {
            expectStatements(expected)
        })
    })
    it("Should be able to handle several concurrent requests", async () => {
        const timestamp = new Date()
        const expected = new Map<Resource,Answer[]>()
        const answers = [
            {correct: false, responseTime, timestamp: new Date(timestamp.toUTCString()).getTime()},
            {correct: true, responseTime, timestamp: new Date(timestamp.toUTCString()).getTime()}
        ]
        expected.set({userID,content},answers)
        const test = supertest(app)
        await Promise.all([
            queryWrite(test,userID,content,timestamp,true,responseTime),
            queryWrite(test,userID,content,timestamp,false)
        ])
        await waitFor(async () => {
            expectStatements(expected)
        })
    })
    it("Should send back a 400 error if the date header is malformed", async () => {
        const test = supertest(app)
        const body = {correct: false}
        const route = writeToLearnerRecord.route.replace(":userID",userID).replace(":content",encodeURIComponent(content))
        await test.put(route).set("Date",new Date().toUTCString() + "junk").send(body).expect(400)
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
    const timestamp = new Date()
    const responseTime = 100
    const app = getApp(mockIp,repo,prefixes,[writeToLearnerRecord])
    const body = {
        correct: true,
        responseTime
    }
    const route = writeToLearnerRecord.route.replace(":userID",userID).replace(":content",encodeURIComponent(content))
    it("Should send a server error if it cannot start a transaction", async () => {
        const test = supertest(app)
        await test.put(route).set("Date",timestamp.toUTCString()).send(body).expect(500)
    })
    it("Should send a server error and attempt a rollback if it cannot execute a transaction", done => {
        const mockDB = getMockDB(mockIp,express(),repo,true,true,false)
        server = mockDB.server.listen(port, () => {
            const test = supertest(app)
            test.put(writeToLearnerRecord.route).set("Date",timestamp.toUTCString()).send(body).expect(500)
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
            const test = supertest(app)
            test.put(route).set("Date",timestamp.toUTCString()).send(body).expect(500)
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
        const timestamp = new Date()
        mockServer.use(express.raw({type: "application/sparql-update"}))
        const mockDB = getMockDB(mockIp,mockServer,repo,true,true,true)
        server = mockDB.server.listen(port, () => {
            const test = supertest(app)
            test.put(route).set("Date", timestamp.toUTCString()).send(body).expect(500)
                .then(() => {
                    try{
                        expect(mockDB.start).toHaveBeenCalled()
                        expect(mockDB.rollback).toHaveBeenCalled()
                        expect(mockDB.exec).toHaveBeenCalled()
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