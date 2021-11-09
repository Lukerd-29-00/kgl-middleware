import { Request, Response } from "express"
import addPerson from "../api-commands/write/addPerson"
import invalidBody from "./invalidBody"

interface ReqBody {
    userID: string,
    transactionID?: string
}

function isReqBody(body: Object): body is ReqBody {
    const entries = Object.entries(body)
    let output: boolean = (body as ReqBody).userID !== undefined
    for (let i = 0; output && i < entries.length; i += 1) {
        switch (entries[i][0]) {
            case "userID":
                break;
            case "transactionID":
                break;
            default:
                output = false;
                break;
        }
    }
    return output
}

async function processAddPerson(request: Request<{}, any, ReqBody>, response: Response): Promise<void> {
    if (!isReqBody(request.body)) {
        invalidBody("userID", "transactionID", response, "addPerson")
    }
    else {

    }
}

// async function processAddPerson(request: Request<{},any,ReqBody>, response: Response): Promise<void>{
//     if(!isReqBody(request.body)){
//         invalidBody("userID","transactionID",response,"addPerson")
//     }
//     else{
//         await (addPerson(request.body.userID,request.body.transactionID).then((value) => {
//             response.send(value)
//         }).catch((e) => {
//             response.send(e.message)
//         }))
//     }
// }

export default processAddPerson