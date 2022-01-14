import {writeAttempt, writeAttemptTimed, TimeInterval, queryStats, waitFor} from "./util"
import userContentStats from "../src/endpoints/userContentStats"
import supertest from "supertest"
import getApp from "../src/server"
import {ip, prefixes} from "../src/config"
import fetch from "node-fetch"
import {mean, median, ResBody, stdev} from "../src/util/QueryOutputParsing/ParseContent"
import {Server} from "http"
import getMockDB from "./mockDB"
import express from "express"
const repo = "userContentStatsTest"
const port = 7202

function expectError(actual: number, expected: number, threshold = 0.01): void{
    const error = Math.abs(actual - expected)/Math.abs(actual)
    expect(error).toBeLessThanOrEqual(threshold)
}

async function expectStats(test: supertest.SuperTest<supertest.Test>, userID: string, content: string, expectedMean: number, expectedMedian: number, expectedStdev: number, interval?: TimeInterval): Promise<void>{
    for(const calcMean of [true, false]){
        for(const calcMedian of [true, false]){
            for(const calcStdev of [true, false]){
                const output = await queryStats(userContentStats.route,test,userID,{content,...interval, mean: calcMean, median: calcMedian, stdev: calcStdev}) as ResBody
                if(calcMean){
                    expect(output).toHaveProperty("mean")
                    expectError(output.mean as number, expectedMean)
                }
                if(calcMedian){
                    expect(output).toHaveProperty("median")
                    expectError(output.median as number, expectedMedian)
                }
                if(calcStdev){
                    expect(output).toHaveProperty("stdev")
                    expectError(output.stdev as number,expectedStdev)
                }
            }
        }
    }

}

describe("userContentStats", () => {
    const userID = "1234"
    const content = "http://aribtrarywebsite/TestContent"
    const resTime = 100
    const getTest = (IP?: string) => {
        return supertest(getApp(IP ? IP : ip, repo, prefixes,[userContentStats]))
    }
    const query = async (test: supertest.SuperTest<supertest.Test>, interval?: TimeInterval) => {
        if(interval !== undefined){
            return await queryStats(userContentStats.route,test,userID,{content,since:interval.since,before:interval.before})
        }
        return await queryStats(userContentStats.route,test,userID,{content})
    }
    it("Should return zero attempts if no attempts at the desired content have been made", async () => {
        expect(await query(getTest())).toHaveProperty("attempts",0)
    })
    it("Should correctly report the number of attempts made at a particular subject, regardless of correctness", async () => {
        await Promise.all([
            writeAttempt(repo,userID,content,true,resTime,2),
            writeAttempt(repo,userID,content,false,resTime),
        ])
        const test = getTest()
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts",3)
        })
        await Promise.all([
            writeAttempt(repo,userID,content,true,resTime),
            writeAttempt(repo,userID,content,false,resTime)
        ])
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts",5)
        })
    })
    it("Should correctly report the number of correct answers for a particular subject", async () => {
        const test = getTest()
        expect(await query(test)).toHaveProperty("correct",0)
        await writeAttempt(repo,userID, content, true,resTime, 3)
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("correct",3)
        })
        await writeAttempt(repo,userID,content, false, resTime, 2)
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts", 5)
        })
        expect(await query(test)).toHaveProperty("correct", 3)
    })
    it("Should be able to narrow down queries between timestamps", async () => {
        const test = getTest()
        const since = new Date("1/7/2021")
        const before = new Date("1/12/2021")
        await Promise.all([
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()+1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()+2),false,resTime),
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()-2),false,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()-2),false,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()+1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()+2),false,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()+3),true,resTime)
        ])
        await Promise.all([
            waitFor(async () => {
                const body = await query(test,{since: new Date("1/6/2021"),before})
                expect(body).toHaveProperty("correct",3)
                expect(body).toHaveProperty("attempts",6)
            }),
            waitFor(async () => {
                const body = await query(test,{since})
                expect(body).toHaveProperty("correct",4)
                expect(body).toHaveProperty("attempts",7)
            }),
            waitFor(async () => {
                const body = await query(test,{since,before})
                expect(body).toHaveProperty("correct",2)
                expect(body).toHaveProperty("attempts",4)
            }),
        ])
    },20000)
    it("Should be able to correctly calculate any combination of the mean, median, and standard deviation of the response times", async () => {
        const resTimes = [100,102,401,1200]
        await Promise.all(resTimes.map((value: number) => {
            writeAttemptTimed(repo,userID,content,new Date(),true,value)
        }))
        await waitFor(async () => {
            await expectStats(getTest(),userID,content,mean(resTimes),median(resTimes),stdev(resTimes))
        })
    })
    it("Should return a statistic as null if calculating it would result in division by zero", async () => {
        const res = await queryStats(userContentStats.route,getTest(),userID,{content,mean:true,median:true,stdev:true})
        expect(res).toHaveProperty("stdev",null)
        expect(res).toHaveProperty("mean",null)
        expect(res).toHaveProperty("median",null)
        await writeAttempt(repo,userID,content,true,100)
        await waitFor(async () => {
            const res = await queryStats(userContentStats.route,getTest(),userID,{content,mean:true,median:true,stdev:true})
            expect(res).toHaveProperty("correct",1) //Make sure the database is finished writing
            expect(res).toHaveProperty("stdev",null)
        })
    })
    it("Should send back a 400 error if the Date header is malformed", async () => {
        await getTest().get(userContentStats.route.replace(":userID",userID).replace(":content",encodeURIComponent(content))).set("Date","junk").expect(400)
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
        const test = getTest()
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts",0)
        })
    })
})

describe("userStats", () => {
    let server: Server | null = null
    const userID = "1234"
    const mockIp = `http://localhost:${port}`
    const defaultURL = userContentStats.route.replace(":userID",userID)
    const getTest = () => {
        return supertest(getApp(mockIp, repo, prefixes,[userContentStats]))
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