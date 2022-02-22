import endpoints from "../src/endpoints/endpoints"
import getApp from "../src/server"
import { ip, prefixes } from "../src/config"
import supertest from "supertest"
import writeToLearnerRecord from "../src/endpoints/writeToLearnerRecord"
import startTransaction from "../src/util/transaction/startTransaction"
import {execTransaction, BodyAction, BodyLessAction} from "../src/util/transaction/ExecTransaction"
import {getPrefixes} from "../src/util/QueryGenerators/SparqlQueryGenerator"
import fetch from "node-fetch"
import express from "express"
import { Server } from "http"
import getMockDB from "./mockDB"
import { queryWrite, waitFor } from "./util"

const repo = "writeToLearnerRecordTest"
const port = 7206

interface Resource{
    userID: string,
    content: string
}

interface Answer{
    correct: boolean,
    timestamp: number,
}

interface ReqBody{
    correct: boolean,
    timestamp: number,
    userID: string,
    standardLearnerContent: string
}

function findStatementQuery(location: Resource, statement: Answer): string{
    let output = getPrefixes(prefixes)
    output += `select ?a where {
        cco:Person_${location.userID} cco:agent_in ?a .
        ?a cco:has_object <${location.content}> ;
           cco:occurs_on / cco:is_tokenized_by "${statement.timestamp}"^^xsd:integer ;
           cco:is_measured_by_nominal / cco:is_tokenized_by "${statement.correct}"^^xsd:boolean .}`
    return output
}

function getFilter(statement: Answer): string{
    let output = `FILTER NOT EXISTS { ?a cco:occurs_on / cco:is_tokenized_by "${statement.timestamp}"^^xsd:integer ;
    cco:is_measured_by_nominal / cco:is_tokenized_by "${statement.correct}"^^xsd:boolean  .}`
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

async function postToWrite(test: supertest.SuperTest<supertest.Test>, body: ReqBody): Promise<void>{
    await test.post(writeToLearnerRecord.route).set("content-type","application/json").send(body).expect(202)
}

describe("writeToLearnerRecord",() => {
    const test = supertest(getApp(ip,repo,prefixes,[writeToLearnerRecord]))
    const userID = "1234"
    const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
    it("Should allow you to add a statement to the learner record", async () => {
        const timestamp = new Date().getTime()
        await postToWrite(test,{
            correct: true,
            timestamp,
            userID,
            standardLearnerContent: content
        })
        const expected = new Map<Resource,Answer[]>()
        expected.set({userID, content},[{correct: true, timestamp}])
        await waitFor(async () => {
            expectStatements(expected)
        })
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
    })
})