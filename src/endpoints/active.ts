import { Request, Response } from "express"
import fetch from "node-fetch"
import Joi from "joi"
import { Endpoint } from "../server"

const schema = Joi.object()

const route = "/active"

async function processActive(request: Request, response: Response, ip: string, defaultRepo: string): Promise<void>{
    const probe = await fetch(`${ip}/repositories/${defaultRepo}/size`).catch((e: Error) => {
        response.status(500)
        response.send(`Got error "${e.message}" while trying to reach "${ip}".\n"`)
    })
    if(probe === undefined){
        return
    }
    if(!probe.ok){
        response.status(502)
        response.send(`Got error "${await probe.text()}" while trying to reach "${ip}".\n"`)
    } else{
        response.send("")
    }
}

const endpoint: Endpoint = {schema, route, process: processActive, method: "get"}
export default endpoint