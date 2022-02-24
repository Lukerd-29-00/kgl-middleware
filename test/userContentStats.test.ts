import {writeAttempt, writeAttemptTimed, TimeInterval, queryStats, waitFor} from "./util"
import userContentStats from "../src/endpoints/userContentStats"
import supertest from "supertest"
import getApp from "../src/server"
import {ip, prefixes} from "../src/config"
import fetch from "node-fetch"
import {ResBody} from "../src/util/QueryOutputParsing/ParseContent"
import {mean, std} from "mathjs"
import readBehavior from "./readErrorBehavior"
const repo = "userContentStatsTest"
const port = 7205

function expectError(actual: number, expected: number, threshold = 0.1): void{
    const error = Math.abs(actual - expected)/Math.abs(actual)
    expect(error).toBeLessThanOrEqual(threshold)
}

async function expectMean(test: supertest.SuperTest<supertest.Test>, userID: string, content: string, expectedMean: number, expectedStdev: number, interval?: TimeInterval): Promise<void>{
    const output = (await queryStats(userContentStats.route,test,userID,{content,...interval, mean: true, stdev: true}) as unknown) as ResBody
    expect(output).toHaveProperty("mean")
    expectError(output.mean as number, expectedMean)
    expectError(output.stdev as number,expectedStdev)
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
    it("Should ignore data concerning different content", async () => {
        await Promise.all([
            writeAttempt(repo,userID,content,true,2,resTime),
            writeAttempt(repo,userID,content,false),
        ])
    })
    it("Should correctly report the number of attempts made at a particular subject, regardless of correctness", async () => {
        await Promise.all([
            writeAttempt(repo,userID,content,true,2,resTime),
            writeAttempt(repo,userID,content,false),
        ])
        const test = getTest()
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts",3)
        })
        await Promise.all([
            writeAttempt(repo,userID,content,true,1,resTime),
            writeAttempt(repo,userID,content,false)
        ])
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("attempts",5)
        })
    })
    it("Should correctly report the number of correct answers for a particular subject", async () => {
        const test = getTest()
        expect(await query(test)).toHaveProperty("correct",0)
        await writeAttempt(repo,userID, content, true,3,resTime)
        await waitFor(async () => {
            expect(await query(test)).toHaveProperty("correct",3)
        })
        await writeAttempt(repo,userID,content, false, 2)
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
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()+2),false),
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(since.getTime()-2),false),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()-1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()-2),false),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()+1),true,resTime),
            writeAttemptTimed(repo,userID,content,new Date(before.getTime()+2),false),
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
    it("Should be able to correctly calculate the mean and standard deviation of the response times", async () => {
        for(let j = 0;j < 3; j++){
            const resTimes = new Array<number>()
            for(let i = 0;i < 5;i++){
                resTimes.push(Math.round(Math.random()*1000)) //Techincally, it is possible for this test to fail on a working program; however, if it is happening regularly, you have a problem.
            }
            await Promise.all(resTimes.map((value: number) => {
                writeAttemptTimed(repo,userID,content,new Date(),true,value)
            }))
            await waitFor(async () => {
                await expectMean(getTest(),userID,content,mean(resTimes),std(resTimes,"uncorrected"))
            })

            await fetch(`${ip}/repositories/${repo}/statements`, {
                method: "DELETE",
            })
            const test = getTest()
            await waitFor(async () => {
                expect(await query(test)).toHaveProperty("attempts",0)
            })
        }
    })
    it("Should return a statistic as null if calculating it would result in division by zero", async () => {
        const res = await queryStats(userContentStats.route,getTest(),userID,{content,mean:true,stdev:true})
        expect(res).toHaveProperty("mean",null)
        expect(res).toHaveProperty("stdev",null)
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

describe("userContentStats", () => {
    const userID = "1234"
    const mockIp = `http://localhost:${port}`
    const route = userContentStats.route.replace(":userID",userID)
    const test = supertest(getApp(mockIp,repo,prefixes,[userContentStats]))
    readBehavior(route,repo,port,test)
})