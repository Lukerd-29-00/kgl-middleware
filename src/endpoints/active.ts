import { Request, Response } from "express"
import fetch from "node-fetch"
import { Endpoint } from "../server"
import {ParamsDictionary, Query} from "express-serve-static-core"

const route = "/active"

async function processActive(request: Request<ParamsDictionary,string,Record<string,string | number | boolean | undefined>,Query>, response: Response<string>, ip: string, defaultRepo: string): Promise<void>{
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
        response.status(204)
        response.send("")
    }
}

const endpoint: Endpoint<ParamsDictionary,string,Record<string,string | number | boolean | undefined>,Query> = {schema: {}, route, process: processActive, method: "get"}
export default endpoint