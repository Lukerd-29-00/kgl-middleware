import fetch from "node-fetch"
import {ip, prefixes} from "../src/config"
import supertest from "supertest"
import { queryStats, TimeInterval, waitFor, writeAttempt, writeAttemptTimed } from "./util"
import getApp from "../src/server"
import userStats from "../src/endpoints/userStats"
import express from "express"
import {Server} from "http"
import getMockDB from "./mockDB"
import { getNumberAttemptsQuery } from "../src/endpoints/userStats"

const repo = "userStatsTest"
const port = 7203

describe("userStats", () => {
    const userID = "1234"
    const content = "http://aribtrarywebsite/TestContent"
    const content2 = "http://aribtrarywebsite/TestContent2"
    const resTime = 100
    const getTest = (IP?: string) => {
        return supertest(getApp(IP ? IP : ip, repo, prefixes,[userStats]))
    }
    const query = async (test: supertest.SuperTest<supertest.Test>, interval?: TimeInterval) => {
        return await queryStats(userStats.route,test,userID,interval !== undefined ? {...interval} : undefined)
    }
    it("Should return an empty object if no content field is specified and no questions have been answered by the user", async () => {
        expect(Object.entries(await query(getTest()))).toHaveLength(0)
    })
    it("Should return an object for each subject the user has answered a question for if no content is supplied", async () => {
        await writeAttempt(repo,userID,content,true,resTime)
        await writeAttempt(repo,userID,content2,false,resTime)
        const test = getTest()
        await waitFor(async () => {
            const body = await query(test)
            expect(body).toHaveProperty(content)
            expect(body).toHaveProperty(content2)
            expect(Object.entries(body)).toHaveLength(2)
        })
    })
    it("Should count the number of attempts in each object correctly", async () => {
        await writeAttempt(repo,userID,content,true,resTime,2)
        const test = getTest()
        await waitFor(async () => {
            expect((await query(test))[content]).toHaveProperty("attempts",2)
        })
        await writeAttempt(repo,userID,content2,false,resTime,3)
        await waitFor(async () => {
            expect((await query(test))[content2]).toHaveProperty("attempts",3)
        })
        expect((await query(test))[content]).toHaveProperty("attempts",2)
    })
    it("Should track the number of correct answers in each object correctly", async () => {
        const test = getTest()
        await writeAttempt(repo,userID,content,false,resTime)
        await waitFor(async () => {
            expect((await query(test))[content]).toHaveProperty("correct",0)
        })
        await writeAttempt(repo,userID,content,true,resTime)
        await writeAttempt(repo,userID,content,false,resTime)
        await waitFor(async () => {
            expect((await query(test))[content]).toHaveProperty("attempts",3)
            expect((await query(test))[content]).toHaveProperty("correct",1)
        })
        await writeAttempt(repo,userID,content2,true,resTime)
        await writeAttempt(repo,userID,content2,false,resTime)
        await waitFor(async () => {
            expect((await query(test))[content2]).toHaveProperty("attempts",2)
        })
        expect((await query(test))[content2]).toHaveProperty("correct",1)
        expect((await query(test))[content]).toHaveProperty("correct",1)
    })
    it("Should be able to narrow down queries between timestamps", async () => {
        const test = getTest()
        const since = new Date("1/7/2021")
        const before = new Date("1/12/2021")
        const content3 = `${content}3`
        await Promise.all([
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()+1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()+2),false,resTime),
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()-2),false,resTime),
            writeAttemptTimed(repo,userID,content2,new Date(since.getTime()+1),true,resTime),
            writeAttemptTimed(repo,userID,content2,new Date(since.getTime()+2),false,resTime),
            writeAttemptTimed(repo,userID,content2,new Date(since.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content2,new Date(since.getTime()-2),false,resTime),
            writeAttemptTimed(repo,userID,content3,new Date(since.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content3,new Date(since.getTime()-2),false,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()-2),false,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()+1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()+2),false,resTime),
            writeAttemptTimed(repo,userID,content2,new Date(before.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content2,new Date(before.getTime()-2),false,resTime),
            writeAttemptTimed(repo,userID,content2,new Date(before.getTime()+1),true,resTime),
            writeAttemptTimed(repo,userID,content2,new Date(before.getTime()+2),false,resTime),
            writeAttemptTimed(repo,userID,content3,new Date(before.getTime()+1),true,resTime),
            writeAttemptTimed(repo,userID,content3,new Date(before.getTime()+2),false,resTime),
            writeAttemptTimed(repo,userID,content3,new Date(before.getTime()+3),true,resTime)
        ])
        
        await Promise.all([
            waitFor(async () => {
                const body = await query(test,{since: new Date("1/6/2021"),before})
                expect(body).toHaveProperty(content)
                expect(body[content]).toHaveProperty("correct",3)
                expect(body[content]).toHaveProperty("attempts",6)
                expect(body).toHaveProperty(content2)
                expect(body[content2]).toHaveProperty("correct", 3)
                expect(body[content2]).toHaveProperty("attempts", 6)
                expect(body).toHaveProperty(content3)
                expect(body[content3]).toHaveProperty("correct",1)
                expect(body[content3]).toHaveProperty("attempts",2)
            }),
            waitFor(async () => {
                const body = await query(test,{since})
                expect(body).toHaveProperty(content)
                expect(body[content]).toHaveProperty("correct",3)
                expect(body[content]).toHaveProperty("attempts",6)
                expect(body).toHaveProperty(content2)
                expect(body[content2]).toHaveProperty("correct", 3)
                expect(body[content2]).toHaveProperty("attempts", 6)
                expect(body).toHaveProperty(content3)
                expect(body[content3]).toHaveProperty("attempts",3)
                expect(body[content3]).toHaveProperty("correct",2)
            }),
            waitFor(async () => {
                const body = await query(test,{since,before})
                expect(body).toHaveProperty(content)
                expect(body[content]).toHaveProperty("correct",2)
                expect(body[content]).toHaveProperty("attempts",4)
                expect(body).toHaveProperty(content2)
                expect(body[content2]).toHaveProperty("correct", 2)
                expect(body[content2]).toHaveProperty("attempts", 4)
                expect(body).not.toHaveProperty(content3)
            })
        ])
    },20000)
    it("Should send back a 400 error if the Date header is malformed and there is no before query parameter", async () => {
        const test = getTest()
        await test.get(userStats.route).set("Date","Wed, 02 Mar 2022 05:00:00 GMTjunk").expect(400)
        await test.get(userStats.route).set("Date","Wed, 02 Mar 2022 05:00:00 GMTjunk").expect(400)
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
        const test = getTest()
        await waitFor(async () => {
            expect(Object.entries(await query(test))).toHaveLength(0)
        })
    })
})

describe("userStats", () => {
    let server: Server | null = null
    const userID = "1234"
    const mockIp = `http://localhost:${port}`
    const defaultURL = userStats.route.replace(":userID",userID)
    const getTest = () => {
        return supertest(getApp(mockIp, repo, prefixes,[userStats]))
    }
    it("Should send back a server error if starting a transaction fails", async () => {
        const test = getTest()
        await test.get(defaultURL).expect(500)
    })
    it("Should send back a server error and attempt a rollback if executing the transaction fails", done => {
        const mockDB = getMockDB(mockIp,express(),repo,true,false,false)
        server = mockDB.server.listen(port,() => {
            const test = getTest()
            test.get(defaultURL).expect(500)
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
        const test = getTest()
        const mockServer = express()
        mockServer.use(express.raw({type: "application/sparql-query"}))
        const mockDB = getMockDB(mockIp,mockServer,repo,true,false,true)
        server = mockDB.server.listen(port,() => {
            const timestamp = new Date()
            test.get(defaultURL).set("Date",timestamp.toUTCString()).expect(200)
                .then(() => {
                    try{
                        expect(mockDB.start).toHaveBeenCalled()
                        expect(mockDB.exec).toHaveBeenCalled()
                        expect(mockDB.exec).toHaveBeenCalledWith(getNumberAttemptsQuery(userID,prefixes,new Date(timestamp.toUTCString()).getTime()- 8.64e+7,new Date(timestamp.toUTCString()).getTime()),"QUERY")
                        waitFor(async () => {
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
        if(server !== null){
            await server.close()
        }
    })
})