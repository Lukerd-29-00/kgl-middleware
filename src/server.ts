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
import express, {Express} from "express"
import {port} from "./globals"




const app = express()

app.use(express.json());

app.use(express.urlencoded({ extended: true }))

app.put('/writeToLearnerRecord', processWriteToLearnerRecord)

app.post("/commit", processCommit)

app.delete("/rollback", processRollback)

app.get("/active", isActive)

app.put("/isPresent", processIsPresent)

export default app







