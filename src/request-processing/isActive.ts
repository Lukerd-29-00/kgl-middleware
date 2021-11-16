import { Request, Response } from "express";
import fetch from "node-fetch";
import invalidBody from "./invalidBody";

async function isActive(request: Request<{},{},{}>, response: Response, ip: string, defaultRepo: string): Promise<void>{
    if(Object.entries(request.body).length !== 0){
        invalidBody([],[],response,"/active")
    }else{
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
        }
        else{
            response.send("")
        }
    }
}

export default isActive