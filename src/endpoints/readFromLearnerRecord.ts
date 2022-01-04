import { Request, Response } from "express"
import Joi from "joi"
import { Endpoint } from "../server"
import readLearnerRecord, { LearnerRecord } from "../util/reads/readLearnerRecord"


const schema = Joi.object({
    userID: Joi.string().required(),
})

function processReadFromLearnerRecord(request: Request, response: Response, ip: string, repo: string, prefixes: Array<[string, string]>) {
    const userID = request.body.userID
    console.log(request.body)
    readLearnerRecord(ip, repo, userID, prefixes).then((result: LearnerRecord) => {
        response.status(200).send({ data: result["response"] })
    })
}

const route = "/readFromLearnerRecord"

const endpoint: Endpoint = { method: "post", schema: schema, route: route, process: processReadFromLearnerRecord }
export default endpoint