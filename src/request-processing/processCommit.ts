import { Request, Response } from "express";
import commitTransaction from "../api-commands/util/transaction/commitTransaction";
import {defaultRepo, ip} from "../globals"

interface ReqBody{ 
    transactionID: string
}

function isReqBody(body: Object): body is ReqBody{
    const entries = Object.entries(body)
    let output: boolean = (body as ReqBody).transactionID !== undefined
    for(let i = 0;output && i < entries.length;i += 1){
        switch(entries[i][0]){
            case "transactionID":
                break;
            default:
                output = false;
                break;
        }
    }
    return output
}

function processCommit(request: Request<{},{},ReqBody>,response: Response): void{
    if(!isReqBody(request.body)){
        response.send("Missing transactionID!")
    }
    else{
        commitTransaction(`${ip}/repositories/${defaultRepo}/transactions/${request.body.transactionID}`).then((value: string) => {
            response.send(value)
        }).catch((e: Error) => {
            response.send(e.message)
        })
    }
}

export default processCommit