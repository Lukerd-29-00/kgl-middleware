import { Request, Response } from "express";
import { ip, defaultRepo } from "../globals";
import fetch from "node-fetch";

async function decideResponse(response: Response, value: any){
    if(!value.ok){
        response.status(500)
        value.text().then((txt: string) => {
            response.send(`Got error "${txt}" while trying to reach "${ip}".\n`)
        }).catch((e: Error) => {
            response.send(`Got error "${e.message}" while trying to reach "${ip}".\n`)
        })
    }
    else{
        response.send("ok\n")
    }
}

async function isActive(request: Request<{},{},{}> | {}, response: Response): Promise<void>{
    try{
        const probe = await fetch(`${ip}/repositories/${defaultRepo}/size`)
        if(!probe.ok){
            response.status(502)
            response.send(`Got error "${await probe.text()}" while trying to reach "${ip}".\n"`)
        }
        else{
            response.send("ok\n")
        }
    }
    catch(e){
        response.status(500)
        response.send(`Got error "${e.message}" while trying to reach "${ip}".\n"`)
    }
}

export default isActive