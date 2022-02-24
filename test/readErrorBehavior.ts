import supertest from "supertest"
import {Server} from "http"
import getMockDB from "./mockDB"
import express from "express"
import { waitFor } from "./util"

export default function readBehavior(route: string, repo: string, port: number, test: supertest.SuperTest<supertest.Test>){
    const mockIp = `http://localhost:${port}`
    let server: Server | null = null
    it("Should respond with a 500 error if it cannot start a transaction", done => {
        const mockDB = getMockDB(mockIp,express(),repo,false,false,false)
        server = mockDB.server.listen(port,() => {
            test.get(route).expect(500).then(() => {
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
            test.get(route).expect(500).then(() => {
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
            test.get(route).expect(500).then(() => {
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
            test.get(route).expect(200).then(() => {
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
            test.get(route).expect(200).then(() => {
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
    it("Should return a 500 error if graphdb sends an invalid response", done => {
        const expServer = express()
        expServer.use(express.raw({type: "application/sparql-query"}))
        const mockDB = getMockDB(mockIp,expServer,repo,true,true,true,{execHandler: (req, res) => {
            if(req.query.action === "COMMIT"){
                res.send()
            }else{
                res.send("invalid data\nhere")
            }
        }})
        server = mockDB.server.listen(port, () => {
            test.get(route).expect(500).then(() => {
                done()
            }).catch(e => {
                done(e)
            })
        })
    })
    afterEach(async () => {
        await server?.close()
    })
}