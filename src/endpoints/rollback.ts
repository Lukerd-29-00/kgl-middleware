import { Response } from "express"
import { Request } from "express"
import rollback from "../util/transaction/Rollback"
import Joi from "joi"
import { Endpoint } from "../server"

const schema = Joi.object({
    transactionID: Joi.string()
})

const route = "/rollback"

async function processRollback(request: Request, response: Response, ip: string, repo: string): Promise<void>{
    await rollback(`${ip}/repositories/${repo}/transactions/${request.body.transactionID}`).then((value: string) => {
        response.send(value)
    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })
}

const endpoint: Endpoint = {schema, route, process: processRollback, method: "post"}
export default endpoint