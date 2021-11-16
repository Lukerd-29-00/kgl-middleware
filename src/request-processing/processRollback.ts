import { Response } from "express";
import { Request } from "express"
import rollback from "../api-commands/util/transaction/Rollback";
import invalidBody from "./invalidBody";

interface ReqBody {
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

async function processRollback(request: Request<{},{},ReqBody>, response: Response, ip: string, repo: string): Promise<void>{
    if(!isReqBody(request.body)){
        invalidBody("transactionID",[],response,"/rollback")
    }
    else{
        await (rollback(`${ip}/repositories/${repo}/transactions/${request.body.transactionID}`).then((value: string) => {
            response.send(value)
        }).catch((e: Error) => {
            response.status(500)
            response.send(e.message)
        }))
    }
}
export default processRollback