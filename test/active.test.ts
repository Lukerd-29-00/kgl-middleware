import active from "../src/endpoints/active"
import supertest from "supertest"
import getApp from "../src/server"
import express, {Response} from "express"
import { Server } from "http"
import {ip, prefixes} from "../src/config"

const port = 7201
const repo = "activeTest"

describe("active", () => {
    const getTest = (IP: string=ip) => {
        return supertest(getApp(IP,repo,prefixes,[active]))
    }
    const mockDB = express()
    let server: null | Server = null

    beforeAll(async () => {
        mockDB.get("repositories/test/size",(res: Response) => {
            res.status(500)
            res.send()
        })
        server = mockDB.listen(port)
        
    })

    it("Should get a 204 status code if the server is running", async () => {
        const test = getTest()
        const res = test.get(active.route)
        await res.expect(204)
    })

    it("Should give a 500 error if the graphdb server returns an error.", async () => {
        const test = getTest(`http://localhost:${port}`)
        const res = test.get(active.route)
        await res.expect(500)
    })

    it("Should get a 500 status error if the graphdb server is not found", async () => {
        const test = getTest("http://localhost:not_a_port")
        const res = test.get(active.route)
        await res.expect(500)
    })

    afterAll(async () => {
        await server?.close()
    })
})