import endpoints from "../src/endpoints/endpoints"
import supertest from "supertest"
import getApp from "../src/server"
import express, {Request, Response} from "express"
import { Server } from "http"


describe("active", () => {
    const mockDB = express()
    let server: null | Server = null

    beforeAll(async () => {
        mockDB.get("repositories/test/size",(req: Request, res: Response) => {
            res.status(500); res.send("tst")
        })
        server = mockDB.listen(7201)
        
    })

    it("Should get a 200 status code if the server is running", async () => {
        const request = supertest(getApp("http://localhost:7200","test",[],endpoints))
        const req = request.get("/active")
        await req.expect(200)
    })

    it("Should give a 502 error if the graphdb server returns an error.", async () => {
        const request = supertest(getApp("http://localhost:7201","test",[],endpoints))
        const req = request.get("/active")
        await req.expect(502)
    })

    it("Should get a 500 status error if the graphdb server is not found", async () => {
        const request = supertest(getApp("http://1","test",[],endpoints))
        const req = request.get("/active")
        await req.expect(500)
    })

    afterAll(async () => {
        if(server){
            await server.close()
        }
    })
})