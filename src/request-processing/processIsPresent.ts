import { Request, Response } from "express";
import isPresent from "../api-commands/read/isPresent";

interface ReqBody{
    userID: string
}

function isReqBody(body: Object): body is ReqBody{
    const entries = Object.entries(body)
    let output: boolean = (body as ReqBody).userID !== undefined
    for(let i = 0;output && i < entries.length;i += 1){
        switch(entries[i][0]){
            case "userID":
                break;
            default:
                output = false;
                break;
        }
    }
    return output
}

async function processIsPresent(request: Request<{},{},ReqBody>, response: Response): Promise<void>{
    if(!isReqBody(request.body)){
        response.status(400)
        response.send("Error: request must have userID in body and nothing else!")
    }
    else {
        isPresent(request.body.userID).then((output: boolean) => {
            if(output){
                response.send("")
            }
            else{
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