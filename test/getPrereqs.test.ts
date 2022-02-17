import getPrereqs from "../src/endpoints/getPrereqs"
import getApp from "../src/server"
import supertest from "supertest"
import {addContent, waitFor, expectEqualHeaders} from "./util"
import {ip, prefixes} from "../src/config"
import joi from "joi"
import fetch from "node-fetch"
import { Server } from "http"
import getMockDB from "./mockDB"
import express from "express"
const repo = "getPrereqsTest"

const port = 7201

function isArray(possibleArray: Array<string> | string): possibleArray is Array<string>{
	return (possibleArray as Array<string>).push != undefined
}

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



function expectItems(arr: unknown, ...items: string[]): void
function expectItems(arr: unknown, items: string[]): void
function expectItems(arr: unknown, ...items: string[] | string[][]): void{
	const schema = joi.array()
	if(items.length > 0 && joi.array().validate(items[0]).error === undefined) items = (items[0] as string[])
	schema.items.apply(schema,(items as string[]).map((item: string) => {
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
	const test = supertest(getApp(mockIp,repo,prefixes,[getPrereqs]))
	const testContent = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
	let server: Server | null = null
	const route = (content: string = testContent) => {
		return getPrereqs.route.replace(":content",encodeURIComponent(content))
	}
	it("Should respond with a 500 error if it cannot start a transaction", done => {
		const mockDB = getMockDB(mockIp,express(),repo,false,false,false)
		server = mockDB.server.listen(port,() => {
			test.get(route()).expect(500).then(() => {
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
			test.get(route()).expect(500).then(() => {
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
			test.get(route()).expect(500).then(() => {
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
			test.get(route()).expect(200).then(() => {
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
			test.get(route()).expect(200).then(() => {
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
	afterEach(async () => {
		await server?.close()
	})
})