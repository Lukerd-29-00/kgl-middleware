import { Request, Response } from "express"
import isPresent from "../api-commands/read/isPresent"
import Joi from "joi"
import { Endpoint } from "../server"

const schema = Joi.object({
    userID: Joi.string(),
    transactionID: Joi.string().optional()
})

const route = "/isPresent"

async function processIsPresent(request: Request, response: Response, ip: string, repo: string): Promise<void>{
    isPresent(request.body.userID,ip, repo, request.body.transactionID,).then((output: boolean) => {
        if(output){
            response.send("")
        } else{
            response.status(404)
            response.send("")
        }

    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })
}

const endpoint: Endpoint = {route: route, schema: schema, process: processIsPresent, method: "put"}
export default endpoint