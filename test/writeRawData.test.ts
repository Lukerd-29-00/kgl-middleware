import getApp from "../src/server"
import { ip, prefixes } from "../src/config"
import supertest from "supertest"
import writeRawData from "../src/endpoints/writeRawData"
import startTransaction from "../src/util/transaction/startTransaction"
import {execTransaction, BodyAction, BodyLessAction} from "../src/util/transaction/ExecTransaction"
import {getPrefixes} from "../src/util/QueryGenerators/SparqlQueryGenerator"
import fetch from "node-fetch"
import express from "express"
import { Server } from "http"
import getMockDB from "./mockDB"
import { queryWrite, waitFor } from "./util"

const repo = "writeRawDataTest"
const port = 7208

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
    const res = await execTransaction(BodyAction.QUERY,transactionLocation,prefixes,body)
    await execTransaction(BodyLessAction.COMMIT,transactionLocation)
    return await res.text()
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
    const test = supertest(getApp(ip, repo, prefixes, [writeRawData]))
    const userID = "1234"
    const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
    const responseTime = 100
    it("Should allow you to say that a person got something right", async () => {
        const time = new Date()
        const expected = new Map<Resource,Answer[]>()
        expected.set({userID,content},[{correct: true, responseTime, timestamp: new Date(time.toUTCString()).getTime()}])
        await queryWrite(test,userID,content,time,true,responseTime)
        await waitFor(async () => {
            expectStatements(expected)
        })  
    })
    it("Should allow you to say that a person got something wrong", async () => {
        const time = new Date()
        const expected = new Map<Resource,Answer[]>()
        expected.set({userID,content},[{correct: false, timestamp: new Date(time.toUTCString()).getTime()}])
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
        await Promise.all([
            queryWrite(test,userID,content,timestamp,true,responseTime),
            queryWrite(test,userID,content,timestamp,false)
        ])
        await waitFor(async () => {
            expectStatements(expected)
        })
    })
    it("Should allow you to upload an array of answers", async () => {
        const timestamp = new Date()
        const expected = new Map<Resource,Answer[]>()
        const answers = [
            {correct: false, timestamp: timestamp.getTime()},
            {correct: true, timestamp: timestamp.getTime(), responseTime: 100},
            {correct: false, timestamp: new Date().getTime()}
        ]
        expected.set({userID,content},answers)
        const route = writeRawData.route.replace(":userID",userID).replace(":content",encodeURIComponent(content))
        await test.put(route).set("Content-Type","application/json").send(answers).expect(202)
        await waitFor(async () => {
            expectStatements(expected)
        })
        
    })
    it("Should send back a 400 error if the date header is malformed", async () => {
        const body = {correct: false}
        const route = writeRawData.route.replace(":userID",userID).replace(":content",encodeURIComponent(content))
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
    const test = supertest(getApp(mockIp,repo,prefixes,[writeRawData]))
    const body = {
        correct: true,
        responseTime,
        timestamp: timestamp.toUTCString()
    }
    const getMockServer = () => {
        const mockServer = express()
        mockServer.use(express.raw({type: "application/sparql-update"}))
        return mockServer

    } 
    const route = writeRawData.route.replace(":userID",userID).replace(":content",encodeURIComponent(content))
    it("Should send a server error if it cannot start a transaction", done => {
        const mockDB = getMockDB(mockIp,express(),repo,false,false,false)
        server = mockDB.server.listen(port, () => {
            test.put(route).send(body).expect(500).end(err => {
                if(err !== undefined){
                    done(err)
                }else{
                    done()
                }
            })
        })
        
    })
    it("Should send a server error and attempt a rollback if it cannot execute a transaction", done => {
        const mockDB = getMockDB(mockIp,getMockServer(),repo,true,true,false)
        server = mockDB.server.listen(port, () => {
            test.put(route).send(body).expect(500)
                .then(() => {
                    expect(mockDB.start).toHaveBeenCalled()
                    expect(mockDB.rollback).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalled()
                    done()
                }).catch((e) => {
                    done(e)
                })
        })
    })
    it("Should still send a server error if it fails the rollback", done => {
        const mockDB = getMockDB(mockIp,getMockServer(),repo,true,false,false)
        server = mockDB.server.listen(port, () => {
            test.put(route).send(body).expect(500)
                .then(() => {
                    expect(mockDB.start).toHaveBeenCalled()
                    expect(mockDB.rollback).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalled()
                    done()
                }).catch((e) => {
                    done(e)
                })
        })
    })
    it("Should send a server error and attempt a rollback if commiting the transaction fails", done => {
        const mockDB = getMockDB(mockIp,getMockServer(),repo,true,true,true,{execHandler:(request, response, next) => {
            if(request.query.action === "COMMIT"){
                next(Error("We're pretending something went wrong with Graphdb here"))
            }else{
                response.end()
            }
        }})
        server = mockDB.server.listen(port, () => {
            test.put(route).send(body).expect(500)
                .then(() => {
                    expect(mockDB.start).toHaveBeenCalled()
                    expect(mockDB.rollback).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalledTimes(2)
                    done()
                }).catch((e) => {
                    done(e)
                })
        })
    })
    it("Should still return the same error if the rollback fails after failing to commit", done => {
        const mockDB = getMockDB(mockIp,getMockServer(),repo,true,true,true,{execHandler:(request, response, next) => {
            if(request.query.action === "COMMIT"){
                next(Error("We're pretending something went wrong with Graphdb here"))
            }else{
                response.end()
            }
        }})
        server = mockDB.server.listen(port, () => {
            test.put(route).send(body).expect(500)
                .then(() => {
                    expect(mockDB.start).toHaveBeenCalled()
                    expect(mockDB.rollback).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalled()
                    done()
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