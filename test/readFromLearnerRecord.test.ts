import { createLearnerRecordTriples } from "../src/endpoints/writeToLearnerRecord"
import startTransaction from "../src/util/transaction/startTransaction"
import {ip, prefixes} from "../src/config"
import { Transaction } from "../src/util/transaction/Transaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import readFromLearnerRecord, { getNumberAttemptsQuery } from "../src/endpoints/readFromLearnerRecord"
import supertest from "supertest"
import getApp from "../src/server"
import fetch from "node-fetch"
import getMockDB from "./mockDB"
import express from "express"
import {Server} from "http"

const repo = "readFromLearnerRecordTest"

interface ResBody{
    correct: number,
    attempts: number
}
async function writeAttempt(userID: string, content: string, correct: boolean, count: number = 1): Promise<void>{
    const location = await startTransaction(ip, repo)
    const promises = []
    for(let i = 0; i < count; i++){
        const triples = createLearnerRecordTriples(userID,content,new Date().getTime(),correct)
        const transaction: Transaction = {
            subj: null,
            pred: null,
            obj: null,
            location: location,
            body: triples,
            action: "UPDATE"
        }
        await ExecTransaction(transaction,prefixes)
    }
    await commitTransaction(location)
}

async function waitFor(callback: () => Promise<void> | void): Promise<void>{
    while(true){
        try{
            await callback()
            break
        }catch(e){
            await new Promise((resolve) => {
                setTimeout(resolve,25)
            })
        }
    } 
}

async function queryEndpoint(test: supertest.SuperTest<supertest.Test>, userID: string, content?: string): Promise<Record<string, number | ResBody>>{
    return (await test.post(readFromLearnerRecord.route).set("Content-Type","application/json").send({userID, content}).expect(200)).body
}

describe("readFromLearnerRecord", () => {
    let server: Server | null = null
    const userID = "1234"
    const content = "http://aribtrarywebsite/TestContent"
    const content2 = "http://aribtrarywebsite/TestContent2"
    const getTest = () => {
        return supertest(getApp(ip, repo, prefixes,[readFromLearnerRecord]))
    }
    const query = async (test: supertest.SuperTest<supertest.Test>) => {
        return await queryEndpoint(test,userID,content)
    }
    const broadQuery = async (test: supertest.SuperTest<supertest.Test>) => {
        return await queryEndpoint(test,userID)
    }
    const mockIp = "http://localhost:7203"

    it("Should return zero attempts if no attempts at the desired content have been made", async () => {
        expect(await query(getTest())).toHaveProperty("attempts",0)
    })
    it("Should correctly report the number of attempts made at a particular subject, regardless of correctness", async () => {
        await Promise.all([
            writeAttempt(userID,content,true,2),
            writeAttempt(userID,content,false),
        ])
        const test = getTest()
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts",3)
        })
        await Promise.all([
            writeAttempt(userID,content,true),
            writeAttempt(userID,content,false)
        ])
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts",5)
        })
    })
    it("Should correctly report the number of correct answers for a particular subject", async () => {
        const test = getTest()
        expect(await query(test)).toHaveProperty("correct",0)
        await writeAttempt(userID, content, true, 3)
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("correct",3)
        })
        await writeAttempt(userID,content, false, 2)
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts", 5)
        })
        expect(await query(test)).toHaveProperty("correct", 3)
    })
    it("Should return an empty object if no content field is specified and no questions have been answered by the user", async () => {
        expect(Object.entries(await broadQuery(getTest()))).toHaveLength(0)
    })
    it("Should return an object for each subject the user has answered a question for if no content is supplied", async () => {
        await writeAttempt(userID,content,true)
        await writeAttempt(userID,content2,false)
        const test = getTest()
        await waitFor(async () => {
            expect(await broadQuery(test)).toHaveProperty(content)
            expect(await broadQuery(test)).toHaveProperty(content2)
        })
    })
    it("Should count the number of attempts in each object correctly", async () => {
        await writeAttempt(userID,content,true,2)
        const test = getTest()
        await waitFor(async () => {
            expect(((await broadQuery(test))[content])).toHaveProperty("attempts",2)
        })
        await writeAttempt(userID,content2,false,3)
        await waitFor(async () => {
            expect(((await broadQuery(test))[content2])).toHaveProperty("attempts",3)
        })
        expect(((await broadQuery(test))[content])).toHaveProperty("attempts",2)
    })
    it("Should track the number of correct answers in each object correctly", async () => {
        const test = getTest()
        await writeAttempt(userID,content,false)
        expect(((await broadQuery(test))[content])).toHaveProperty("correct",0)
        await writeAttempt(userID,content,true)
        await writeAttempt(userID,content,false)
        await waitFor(async () => {
            expect(((await broadQuery(test))[content])).toHaveProperty("attempts",3)
            expect(((await broadQuery(test))[content])).toHaveProperty("correct",1)
        })
        await writeAttempt(userID,content2,true)
        await writeAttempt(userID,content2,false)
        await waitFor(async () => {
            expect(((await broadQuery(test))[content2])).toHaveProperty("attempts",2)
        })
        expect(((await broadQuery(test))[content2])).toHaveProperty("correct",1)
        expect(((await broadQuery(test))[content])).toHaveProperty("correct",1)
    })
    it("Should send back a server error if starting a transaction fails", async () => {
        const test = supertest(getApp(mockIp,repo,prefixes,[readFromLearnerRecord]))
        await test.post(readFromLearnerRecord.route).set("Content-Type","application/json").send({userID}).expect(500)
    })
    it("Should send back a server error and attempt a rollback if executing the transaction fails", done => {
        const mockDB = getMockDB(mockIp,express(),repo,true,false,false)
        server = mockDB.server.listen(7203,() => {
            const test = supertest(getApp(mockIp,repo,prefixes,[readFromLearnerRecord]))
            test.post(readFromLearnerRecord.route).set("Content-Type","application/json").send({userID}).expect(500)
            .then(() => {
                try{
                    expect(mockDB.start).toHaveBeenCalled()
                    done()
                }catch(e){
                    done(e)
                }
            }).catch((e) => {
                done(e)
            })
        })
    })
    it("Should not send a server error if committing the transaction fails", done => {
        const test = supertest(getApp(mockIp,repo,prefixes,[readFromLearnerRecord]))
        const mockServer = express()
        mockServer.use(express.raw({type: "application/sparql-query"}))
        const mockDB = getMockDB(mockIp,mockServer,repo,true,false,true)
        server = mockDB.server.listen(7203,() => {
            const timestamp = new Date()
            test.post(readFromLearnerRecord.route).set("Content-Type","application/json").set("Date",timestamp.toUTCString()).send({userID}).expect(200)
            .then(() => {
                try{
                    expect(mockDB.start).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalledWith(getNumberAttemptsQuery(userID,prefixes,0,new Date(timestamp.toUTCString()).getTime()),"QUERY")
                    waitFor(() => {
                        expect(mockDB.exec).toHaveBeenCalledTimes(2)
                    }).then(done)
                }catch(e){
                    done(e)
                }
            }).catch((e) => {
                done(e)
            })
        })
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
        const test = getTest()
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts",0)
        })
        if(server !== null){
            await server.close()
        }
    })
})