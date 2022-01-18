import { Request, Response } from "express"
import fetch from "node-fetch"
import { Endpoint } from "../server"
import {ParamsDictionary, Query} from "express-serve-static-core"
import { nextTick } from "process"

const route = "/active"

async function processActive(request: Request<ParamsDictionary,string,Record<string,string | number | boolean | undefined>,Query>, response: Response<string>, next: (e?: Error) => void, ip: string, defaultRepo: string): Promise<void>{
    const probe = await fetch(`${ip}/repositories/${defaultRepo}/size`).catch((e: Error) => {
        next(Error(`Got error "${e.message}" while trying to reach "${ip}".\n"`))
    })
    if(probe === undefined){
        const e = Error("Unknown error. Try again")
        next(e)
        throw e
    }
    if(!probe.ok){
        const e = Error(`Got error "${await probe.text()}" while trying to reach "${ip}".\n"`)
        next(e)
        throw e
    }else{
        response.status(204)
        next()
    }
}

const endpoint: Endpoint<ParamsDictionary,string,Record<string,string | number | boolean | undefined>,Query> = {schema: {}, route, process: processActive, method: "get"}
export default endpoint