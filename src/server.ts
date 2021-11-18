// We should add some way to verify who the request is coming from; there needs to be some kind of authentication to stop people from messing with each others' accounts!
/**
 *  Middleware software For Knowledge Apps and Leaners Models
 *  Knowledge Graphs For learners 
 *  Casey Rock 
 *  July 30, 2021
 */
import isActive from "./request-processing/isActive"
import processCommit from "./request-processing/processCommit"
import processIsPresent from "./request-processing/processIsPresent"
import processRollback from "./request-processing/processRollback"
import processWriteToLearnerRecord from "./request-processing/processWriteToLearnerRecord"
import express, {Express, Request, Response} from "express"
import morgan from "morgan"

export default function getApp(ip: string, repo: string, prefixes: Array<[string ,string]>, log?: boolean): Express{
    const app = express()
    if(log){
        app.use(morgan("combined"))
    }
    app.use(express.json())

    app.use(express.urlencoded({ extended: true }))

    app.put("/writeToLearnerRecord", (req: Request, res: Response) => {
        processWriteToLearnerRecord(req, res, ip, repo)
    })

    app.post("/commit", (req: Request, res: Response) => {
        processCommit(req, res, ip, repo)
    })

    app.delete("/rollback", (req: Request, res: Response) => {
        processRollback(req,res,ip,repo)
    })

    app.get("/active", (req: Request, res: Response) => {
        isActive(req, res, ip, repo)
    })

    app.put("/isPresent", (req: Request, res: Response) => {
        processIsPresent(req,res,ip,repo)
    })

    return app
}







