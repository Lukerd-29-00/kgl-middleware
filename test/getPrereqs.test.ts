import getPrereqs from "../src/endpoints/getPrereqs"
import getApp from "../src/server"
import supertest from "supertest"
import {addContent, waitFor, expectEqualHeaders} from "./util"
import {ip, prefixes} from "../src/config"
import joi from "joi"
import fetch from "node-fetch"
import readBehavior from "./readErrorBehavior"
const repo = "getPrereqsTest"

const port = 7202

export async function queryPrereqs(test: supertest.SuperTest<supertest.Test>, content: string): Promise<unknown>{
    const route = getPrereqs.route.replace(":content",encodeURIComponent(content))
    return (await test.get(route).expect(200)).body
}

async function headPrereqs(test: supertest.SuperTest<supertest.Test>,content: string): Promise<Record<string, unknown>>{
    const route = getPrereqs.route.replace(":content",encodeURIComponent(content))
    return (await test.head(route).expect(204)).headers
}

async function getPrereqHeaders(test: supertest.SuperTest<supertest.Test>,content: string): Promise<Record<string, unknown>>{
    const route = getPrereqs.route.replace(":content",encodeURIComponent(content))
    return (await test.get(route).expect(200)).headers
}


function expectItems(arr: unknown, ...items: string[]): void{
    const schema = joi.array()
    schema.items(schema,...items.map((item: string) => {
        return joi.string().valid(item).required()
    }))
    const {error} = schema.validate(arr)
    expect(error).toBeUndefined()
}

describe("getPrereqs", () => {
    const test = supertest(getApp(ip,repo,prefixes,[getPrereqs]))
    const testContent = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
    it("Should return an empty list if the content does not exist or has no cco:has_part relation",async () => {
        const res = await queryPrereqs(test,testContent)
        expect(joi.array().validate(res).error).toBeUndefined()
        expect(res).toHaveLength(0)
        expectEqualHeaders(test,testContent,headPrereqs,getPrereqHeaders)
    })
    it("Should work for content that has only one prerequisite", async () => {
        await addContent(repo, testContent, `${testContent}2`)
        await waitFor(async () => {
            const body = await queryPrereqs(test,testContent)
            expectItems(body,`${testContent}2`)
        })
        expectEqualHeaders(test,testContent,headPrereqs,getPrereqHeaders)
    })
    it("Should work for content with several prerequisites", async () => {
        await addContent(repo,testContent,`${testContent}2`,`${testContent}3`,`${testContent}4`)
        await waitFor(async () => {
            const body = await queryPrereqs(test,testContent)
            expectItems(body,`${testContent}2`,`${testContent}3`,`${testContent}4`)
        })
        expectEqualHeaders(test,testContent,headPrereqs,getPrereqHeaders)
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
    })
})

describe("getPrereqs",() => {
    const mockIp = `http://localhost:${port}`
    const testContent = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
    const test = supertest(getApp(mockIp,repo,prefixes,[getPrereqs]))
    readBehavior(getPrereqs.route.replace(":content",encodeURIComponent(testContent)),repo,port,test)
})