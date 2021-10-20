import { Response } from "express";

function getStrings(arr: string | string[]): string | null{
    if(arr.length === 0){
        return null
    }
    else if(typeof arr === "string"){
        return arr
    }
    else{
        arr[arr.length - 1] = `and ${arr[arr.length-1]}`
        return arr.join(", ")
    }
}

export default function invalidBody(requiredFields: string | string[], optionalFields: string | string[], response: Response, endpoint: string): void{
    response.status(400)
    const required = getStrings(requiredFields)
    const optional = getStrings(optionalFields)
    if(required === null && optional === null){
        response.send(`Invalid request; an argument was supplied to ${endpoint}, which expects no arguments.\n`)
    }
    else{
        response.send(`Invalid request; either a required field for ${endpoint} is missing, or an unrecognized field was supplied. Make sure the Content-Type header is set to application/json. ${required === null ? "there are no required fields" : `The required fields are ${required}`}; ${optional === null ? "There are no optional fields" : `The optional fields are ${optional}`}.\n`)
    }
}