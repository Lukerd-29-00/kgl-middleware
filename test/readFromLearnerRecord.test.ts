import fetch from "node-fetch"
import {ip, prefixes} from "../src/config"
import supertest from "supertest"
import { waitFor, writeAttempt } from "./util"
import getApp from "../src/server"
import readFromLearnerRecord from "../src/endpoints/readFromLearnerRecord"
import express from "express"
import {Server} from "http"
import getMockDB from "./mockDB"
import joi from "joi"

const repo = "readFromLearnerRecordTest"
const port = 7205


describe("readFromLearnerRecord", () => {
    const userID = "1234"
    const content = "http://aribtrarywebsite/TestContent"
    const content2 = "http://aribtrarywebsite/TestContent2"
    const resTime = 100
    const test = supertest(getApp(ip, repo, prefixes,[readFromLearnerRecord])) //This can be shared because the API follows REST, and should therefore be stateless.
    const query = async () => {
        return await test.put(readFromLearnerRecord.route).send({userID}).expect(200)
    }
    it("Should return an empty object if nothing has been written to the record", async () => {
        const res = (await query()).body
        expect(joi.object().validate(res).error).toBeUndefined()
        expect(Object.entries(res as Record<string,unknown>)).toHaveLength(0)
    })
    it("Should return an object for each subject the user has answered a question for if no content is supplied", async () => {
        await writeAttempt(repo,userID,content,true,1,resTime)
        await writeAttempt(repo,userID,content2,false)
        await waitFor(async () => {
            const body = (await query()).body
            expect(body).toHaveProperty(content)
            expect(body).toHaveProperty(content2)
            expect(Object.entries(body as Record<string,unknown>)).toHaveLength(2)
        })
    })
    it("Should count the number of attempts in each object correctly", async () => {
        await writeAttempt(repo,userID,content,true,2,resTime)
        await waitFor(async () => {
            const body = (await query()).body
            expect(body[content]).toHaveProperty("attempts",2)
        })
        await writeAttempt(repo,userID,content2,false,3)
        await waitFor(async () => {
            const body = (await query()).body
            expect(body[content2]).toHaveProperty("attempts",3)
        })
        expect((await query()).body[content]).toHaveProperty("attempts",2)
    })
    it("Should track the number of correct answers in each object correctly", async () => {
        await writeAttempt(repo,userID,content,false)
        await waitFor(async () => {
            expect((await query()).body[content]).toHaveProperty("correct",0)
        })
        await writeAttempt(repo,userID,content,true,1,resTime)
        await writeAttempt(repo,userID,content,false)
        await waitFor(async () => {
            expect((await query()).body[content]).toHaveProperty("attempts",3)
            expect((await query()).body[content]).toHaveProperty("correct",1)
        })
        await writeAttempt(repo,userID,content2,true,1,resTime)
        await writeAttempt(repo,userID,content2,false)
        await waitFor(async () => {
            const body = (await query()).body
            expect(body[content2]).toHaveProperty("attempts",2)
        })
        expect((await query()).body[content2]).toHaveProperty("correct",1)
        expect((await query()).body[content]).toHaveProperty("correct",1)
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
        await waitFor(async () => {
            expect(Object.entries((await query()).body)).toHaveLength(0)
        })
    })
})

describe("readFromLearnerRecord", () => {
    const mockIp = `http://localhost:${port}`
    const test = supertest(getApp(mockIp,repo,prefixes,[readFromLearnerRecord]))
    const userID = "1234"
    const body = {userID}
    let server: Server | undefined
    it("Should respond with a 500 error if it cannot start a transaction", done => {
        const mockDB = getMockDB(mockIp,express(),repo,false,false,false)
        server = mockDB.server.listen(port,() => {
            test.put(readFromLearnerRecord.route).send(body).expect(500).then(() => {
                expect(mockDB.start).toHaveBeenCalled()
                done()
            }).catch((e: Error) => {
                done(e)
            })
        })
    })
    it("Should respond with a 500 error and attempt a rollback if it cannot execute the transaction", done => {
        const exp = express()
        exp.use(express.raw({type: "application/sparql-query"}))
        const mockDB = getMockDB(mockIp,exp,repo,true,true,false)
        server = mockDB.server.listen(port,() => {
            test.put(readFromLearnerRecord.route).send(body).expect(500).then(() => {
                expect(mockDB.start).toHaveBeenCalled()
                expect(mockDB.exec).toHaveBeenCalled()
                waitFor(async () => {
                    expect(mockDB.rollback).toHaveBeenCalled()
                }).then(() => {
                    done()
                })
            }).catch(e => {
                done(e)
            })
        })
    })
    it("Should respond with a 500 error if failing to execute the transaction results in a rollback that fails", done => {
        const exp = express()
        exp.use(express.raw({type: "application/sparql-query"}))
        const mockDB = getMockDB(mockIp,exp,repo,true,false,false)
        server = mockDB.server.listen(port, () => {
            test.put(readFromLearnerRecord.route).send(body).expect(500).then(() => {
                expect(mockDB.start).toHaveBeenCalled()
                expect(mockDB.exec).toHaveBeenCalled()
                waitFor(async () => {
                    expect(mockDB.rollback).toHaveBeenCalled()
                }).then(() => {
                    done()
                }).catch(e => {
                    done(e)
                })
            })
        })
    })
    it("Should give a successful response and attempt a rollback if committing the transaction fails", done => {
        const exp = express()
        exp.use(express.raw({type: "application/sparql-query"}))
        const mockDB = getMockDB(mockIp,exp,repo,true,true,true,{execHandler: (req,res) => {
            if(req.query.action !== "COMMIT"){
                res.send()
            }else{
                res.status(500)
                res.send()
            }
        }})
        server = mockDB.server.listen(port, () => {
            test.put(readFromLearnerRecord.route).send(body).expect(200).then(() => {
                expect(mockDB.start).toHaveBeenCalled()
                expect(mockDB.exec).toHaveBeenCalled()
                waitFor(async () => {
                    expect(mockDB.rollback).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalledTimes(2)
                }).then(() => {
                    done()
                }).catch(e => {
                    done(e)
                })
            })
        })
    })
    it("Should give a successful response if failing to commit the transaction leads to a failed rollback", done => {
        const exp = express()
        exp.use(express.raw({type: "application/sparql-query"}))
        const mockDB = getMockDB(mockIp,exp,repo,true,false,true,{execHandler: (req,res) => {
            if(req.query.action !== "COMMIT"){
                res.send()
            }else{
                res.status(500)
                res.send()
            }
        }})
        server = mockDB.server.listen(port, () => {
            test.put(readFromLearnerRecord.route).send(body).expect(200).then(() => {
                expect(mockDB.start).toHaveBeenCalled()
                expect(mockDB.exec).toHaveBeenCalled()
                waitFor(async () => {
                    expect(mockDB.rollback).toHaveBeenCalled()
                    expect(mockDB.exec).toHaveBeenCalledTimes(2)
                }).then(() => {
                    done()
                }).catch(e => {
                    done(e)
                })
            })
        })
    })
    it("Should return a 500 error if graphdb sends an invalid response", done => {
        const expServer = express()
        expServer.use(express.raw({type: "application/sparql-query"}))
        const mockDB = getMockDB(mockIp,expServer,repo,true,true,true,{execHandler: (req, res) => {
            if(req.query.action === "COMMIT"){
                res.send()
            }else{
                res.send("invalid data\nhere")
            }
        }})
        server = mockDB.server.listen(port, () => {
            test.put(readFromLearnerRecord.route).send(body).expect(500).then(() => {
                done()
            }).catch(e => {
                done(e)
            })
        })
    })
    afterEach(async () => {
        await server?.close()
    })
})