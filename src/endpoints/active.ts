import { Request, Response } from "express"
import fetch from "node-fetch"
import { Endpoint } from "../server"
import {ParamsDictionary, Query} from "express-serve-static-core"
import { nextTick } from "process"

const route = "/active"

async function processActive(request: Request<ParamsDictionary,string,Record<string,string | number | boolean | undefined>,Query>, response: Response<string>, next: (e?: Error) => void, ip: string, defaultRepo: string): Promise<void>{
    fetch(`${ip}/repositories/${defaultRepo}/size`).then(probe => {
        if(!probe.ok){
            probe.text().then(res => {
                const e = new Error("Could not find graphdb")
                next(e)
            }).catch(e => {
                next(e)
            })

        }else{
            response.status(204)
            next()
        }
    }).catch((e: Error) => {
        next(e)
    })

    
}

const endpoint: Endpoint<ParamsDictionary,string,Record<string,string | number | boolean | undefined>,Query> = {schema: {}, route, process: processActive, method: "get"}
export default endpoint