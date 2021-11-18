import { Request, Response } from "express"
import commitTransaction from "../api-commands/util/transaction/commitTransaction"
import invalidBody from "./invalidBody"
import {ParamsDictionary} from "express-serve-static-core"

interface ReqBody{ 
    transactionID: string
}

function isReqBody(body: Object): body is ReqBody{
    const entries = Object.entries(body)
    let output: boolean = (body as ReqBody).transactionID !== undefined
    for(let i = 0;output && i < entries.length;i += 1){
        switch(entries[i][0]){
        case "transactionID":
            break
        default:
            output = false
            break
        }
    }
    return output
}

async function processCommit(request: Request<ParamsDictionary,any,ReqBody>,response: Response, ip: string, defaultRepo: string): Promise<void>{
    if(!isReqBody(request.body)){
        invalidBody("transactionID",[],response,"/commit")
    } else{
        await commitTransaction(`${ip}/repositories/${defaultRepo}/transactions/${request.body.transactionID}`).then((value: string) => {
            response.send(value)
        }).catch((e: Error) => {
            response.status(500)
            response.send(e.message)
        })
    }
}

export default processCommit