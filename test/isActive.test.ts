import active from "../src/endpoints/active"
import supertest from "supertest"
import getApp from "../src/server"
import express, {Response} from "express"
import { Server } from "http"
import {ip} from "../src/config"

const port = 7203
const repo = "isActiveTest"

describe("active", () => {
    const mockDB = express()
    let server: null | Server = null

    beforeAll(async () => {
        mockDB.get("repositories/test/size",(res: Response) => {
            res.status(500); res.send("tst")
        })
        server = mockDB.listen(port)
        
    })

    it("Should get a 200 status code if the server is running", async () => {
        const request = supertest(getApp(ip,repo,[],[active]))
        const req = request.get(active.route)
        await req.expect(204)
    })

    it("Should give a 502 error if the graphdb server returns an error.", async () => {
        const request = supertest(getApp(`http://localhost:${port}`,"isActiveTest",[],[active]))
        const req = request.get(active.route)
        await req.expect(500)
    })

    it("Should get a 500 status error if the graphdb server is not found", async () => {
        const request = supertest(getApp("http://1","isActiveTest",[],[active]))
        const req = request.get(active.route)
        await req.expect(500)
    })

    afterAll(async () => {
        if(server){
            await server.close()
        }
    })
})