import { Request, Response } from "express"
import fetch from "node-fetch"
import { Endpoint } from "../server"
import {ParamsDictionary, Query} from "express-serve-static-core"

const route = "/active"

/**
 * Processes an incoming request to the /active resource by determining if the Graphdb server pointed to in config.ts is reachable. Calls next() if it is, and next(e) if it encounters an error e reaching the server.
 * @param request The request sent to the /active resource
 * @param response The response to request
 * @param next A callback that calls the next function in the middleware stack
 * @param ip The url of the graphdb server
 * @param defaultRepo The desired repository
 * @async
 */
async function processActive(request: Request<ParamsDictionary,string,Record<string,string | number | boolean | undefined>,Query>, response: Response<string>, next: (e?: Error) => void, ip: string, defaultRepo: string): Promise<void>{
    fetch(`${ip}/repositories/${defaultRepo}/size`).then(async probe => {
        if(!probe.ok){
            return await probe.text().then(() => {
                next(Error("Could not find graphdb"))
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