import { Response } from "express";
import { Request } from "express"
import { ResponseMessage } from "rdf-namespaces/dist/http";
import rollback from "../api-commands/util/transaction/Rollback";
import {ip, defaultRepo} from "../globals";

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

async function processRollback(request: Request<{},{},ReqBody>, response: Response): Promise<void>{
    if(!isReqBody(request.body)){
        response.send("Missing transactionID!")
    }
    else{
        await (rollback(`${ip}/repositories/${defaultRepo}/transactions/${request.body.transactionID}`).then((value: string) => {
            response.send(value)
        }).catch((e: Error) => {
            response.send(e.message)
        }))
    }
}
export default processRollback