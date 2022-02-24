import supertest from "supertest"
import getRawData, {Answer} from "../src/endpoints/getRawData"
import Joi from "joi"
import getApp from "../src/server"
import {ip, prefixes} from "../src/config"
import {waitFor, writeAttemptTimed} from "./util"
import fetch from "node-fetch"
import getMockDB from "./mockDB"
import {Server} from "http"
import express from "express"
import readBehavior from "./readErrorBehavior"
const port = 7202
const repo = "getRawDataTest"

function getSchemaForAnswer(timestamp: Date, correct: false): Joi.ObjectSchema<Answer>
function getSchemaForAnswer(timestamp: Date, correct: true, responseTime: number): Joi.ObjectSchema<Answer>
function getSchemaForAnswer(timestamp: Date, correct: boolean, responseTime?: number): Joi.ObjectSchema<Answer>{
    if(correct){
        return Joi.object({
            correct: Joi.boolean().required().valid(true),
            timestamp: Joi.number().integer().unit("milliseconds").required().valid(new Date(timestamp.toUTCString()).getTime()),
            responseTime: Joi.number().integer().unit("milliseconds").required().valid(responseTime)
        })
    }else{
        return Joi.object({
            correct: Joi.boolean().required().valid(false),
            timestamp: Joi.number().integer().unit("milliseconds").required().valid(new Date(timestamp.toUTCString()).getTime())
        })
    }
}

const answerSchema: Joi.ObjectSchema<Answer> = Joi.object({
    correct: Joi.boolean().required(),
    timestamp: Joi.number().integer().unit("milliseconds").required(),
    responseTime: Joi.when("correct",{
        is: Joi.boolean().required().valid(true),
        then: Joi.number().integer().unit("milliseconds").required(),
        otherwise: Joi.forbidden()
    })
})

async function queryRaw(test: supertest.SuperTest<supertest.Test>, userID: string, content: string, since: string, before :string, schema?: Joi.ArraySchema): Promise<Answer[]>{
    let url = getRawData.route
    url = url.replace(":userID",userID).replace(":content",encodeURIComponent(content))
    url += `?since=${since}&before=${before}`
    const res: Array<Answer> = (await test.get(url).expect(200).catch(e => {
        console.log(e)
        throw e
    })).body
    const {error} = schema === undefined ? Joi.array().required().items(answerSchema).validate(res) : schema.validate(res)
    expect(error).toBeUndefined()
    return res as Answer[]
}

describe("getRawData",() => {
    const test = supertest(getApp(ip,repo,prefixes,[getRawData]))
    const userID = "1234"
    const content = "http://aribtrarywebsite/TestContent"
    const since = new Date("1/14/2022")
    const before = new Date("2/14/2022")
    it("Should return an empty array if no data is found", async () => {
        const body = await queryRaw(test,userID,content,new Date(0).toUTCString(),new Date().toUTCString())
        expect(body).toHaveLength(0)
    })
    it("Should retrieve all the data between since and before, inclusive.", async () => {
        const time = new Date("1/15/2022")
        const beforeSince = new Date("1/13/2022")
        const afterBefore = new Date("2/15/2022")
        await Promise.all([
            writeAttemptTimed(repo,userID,content,beforeSince,false),
            writeAttemptTimed(repo,userID,content,since,true,150),
            writeAttemptTimed(repo,userID,content,time,false),
            writeAttemptTimed(repo, userID, content, time, true, 100),
            writeAttemptTimed(repo,userID,content,before,false),
            writeAttemptTimed(repo,userID,content,afterBefore,true,300)
        ])
        const expected = Joi.array().items(
            getSchemaForAnswer(since,true,150).required(),
            getSchemaForAnswer(time,false).required(),
            getSchemaForAnswer(time,true,100).required(),
            getSchemaForAnswer(before,false).required()
        ).length(4)
        await waitFor(async () => {
            await queryRaw(test,userID,content,since.toUTCString(),before.toUTCString(),expected)
        })
    })
    it("Should send back a 400 error if you supply a since that comes after the before argument", async () => {
        await test.get(getRawData.route.replace(":userID",userID).replace(":content",encodeURIComponent(content) + `?since=${before.toUTCString()}&before=${since.toUTCString()}`)).expect(400)
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
    })
})

describe("getRawData", () => {
    const userID = "1234"
    const mockIp = `http://localhost:${port}`
    const content = "http://aribtrarywebsite/TestContent"
    const since = new Date("1/14/2022")
    const before = new Date("2/14/2022")
    const route = getRawData.route.replace(":userID",userID).replace(":content",encodeURIComponent(content)) + `?since=${since.toUTCString()}&before=${before.toUTCString()}`
    const test = supertest(getApp(mockIp, repo, prefixes,[getRawData]))
    readBehavior(route,repo,port,test)
})