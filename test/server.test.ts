import getApp, {Endpoint} from "../src/server"
import {Request, Response} from "express"
import Joi from "joi"
import supertest from "supertest"

describe("server", () => {
    it("Should verify each request to make sure it fits the endpoint's schema", async () => {
        const route = "/test"
        const schema = Joi.object({
            key1: Joi.string().required(),
            key2: Joi.string().optional()
        }) 
        const testEndoint: Endpoint = {
            route,
            schema,
            method: "put",
            process: (request: Request, response: Response) => {
                response.send("")
            }
        }
        const server = getApp("http://localhost:7200","doesn't matter",[],[testEndoint])
        const test = supertest(server)
        await test.put(route).set("Content-Type","application/json").send({}).expect(400)
        await test.put(route).set("Content-Type","application/json").send({key1: "hi"}).expect(200)
        await test.put(route).set("Content-Type","application/json").send({key1: "hi", key2: "hello"}).expect(200)
        await test.put(route).set("Content-Type","application/json").send({key2: "hello"}).expect(400)
        await test.put(route).set("Content-Type","application/json").send({key1: "hi", key2: "hello", key3: "greetings"}).expect(400)
    })
})