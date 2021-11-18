import { Request, Response } from "express"
import isPresent from "../api-commands/read/isPresent"
import invalidBody from "./invalidBody"
import {ParamsDictionary} from "express-serve-static-core"

interface ReqBody{
    userID: string,
    transactionID?: string
}

function isReqBody(body: Object): body is ReqBody{
    const entries = Object.entries(body)
    let output: boolean = (body as ReqBody).userID !== undefined
    for(let i = 0;output && i < entries.length;i += 1){
        switch(entries[i][0]){
        case "userID":
            break
        case "transactionID":
            break
        default:
            output = false
            break
        }
    }
    return output
}

async function processIsPresent(request: Request<ParamsDictionary,any,ReqBody>, response: Response, ip: string, repo: string): Promise<void>{
    if(!isReqBody(request.body)){
        invalidBody("userID","transactionID",response,"isPresent")
    } else {
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
}

export default processIsPresent