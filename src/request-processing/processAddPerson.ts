import { Request, Response } from "express"
import addPerson from "../api-commands/write/addPerson"
import {defaultRepo} from "../globals"

interface ReqBody{
    userID: string
}

function isReqBody(body: any): body is ReqBody{
    return (body as ReqBody).userID !== undefined
}

function processAddPerson(request: Request<{},any,ReqBody>, response: Response): void{
    if(!isReqBody(request.body)){
        response.send("Requires a unique ID to be sent through the body! Make sure Content-Type is set to application/json!\n")
    }
    else{
        addPerson(request.body.userID,defaultRepo).then((value) => {
            response.send("Successfully added a new graph!\n")
        }).catch((e) => {
            response.send(`Something went wrong: ${e.message}`)
        })
    }
}

export default processAddPerson