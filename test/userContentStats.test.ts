import {writeAttempt, writeAttemptTimed, TimeInterval, queryStats, waitFor} from "./util"
import userContentStats from "../src/endpoints/userContentStats"
import supertest from "supertest"
import getApp from "../src/server"
import {ip, prefixes} from "../src/config"
import fetch from "node-fetch"

const repo = "userContentStatsTest"
const port = 7202

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
        const content3 = `${content}3`
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