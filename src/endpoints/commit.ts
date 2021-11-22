import { Request, Response } from "express"
import commitTransaction from "../api-commands/util/transaction/commitTransaction"
import Joi from "joi"
import { Endpoint } from "../server"

const schema = Joi.object({
    transactionID: Joi.string()
})

const route = "/commit"

async function processCommit(request: Request,response: Response, ip: string, defaultRepo: string): Promise<void>{
    await commitTransaction(`${ip}/repositories/${defaultRepo}/transactions/${request.body.transactionID}`).then((value: string) => {
        response.send(value)
    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })   
}

const endpoint: Endpoint = {route: route, schema: schema, process: processCommit, method: "post"}
export default endpoint