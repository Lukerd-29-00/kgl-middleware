// We should add some way to verify who the request is coming from; there needs to be some kind of authentication to stop people from messing with each others' accounts!
/**
 *  Middleware software For Knowledge Apps and Leaners Models
 *  Knowledge Graphs For learners 
 *  Casey Rock 
 *  July 30, 2021
 */
import { rdf } from "rdf-namespaces";
import isActive from "./request-processing/isActive";
import processAddPerson from "./request-processing/processAddPerson";
import processCommit from "./request-processing/processCommit";
import processIsPresent from "./request-processing/processIsPresent";
import processRollback from "./request-processing/processRollback";
import processWriteToLearnerRecord from "./request-processing/processWriteToLearnerRecord"
const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const port = 4000

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

app.put('/writeToLearnerRecord', processWriteToLearnerRecord)

app.put("/addPerson", processAddPerson)

// app.post("/commit", processCommit)

// app.delete("/rollback", processRollback)

// app.get("/active", isActive)

// app.put("/isPresent", processIsPresent)

app.listen(port, () => {
    console.log(`Middleware software listening on port ${port}`)
})





