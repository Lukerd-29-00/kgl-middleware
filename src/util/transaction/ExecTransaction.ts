import fetch, {Response} from "node-fetch"
import { insertQuery } from "./insertQuery"
import { URL } from "url"
import { deleteQuery } from "./deleteQuery"



export const enum BodyAction{
    UPDATE = "UPDATE",
    QUERY = "QUERY",
    DELETE = "DELETE"
}

export const enum BodyLessAction{
    COMMIT = "COMMIT"
}

export async function execTransaction(action: BodyLessAction, location: string): Promise<Response>
export async function execTransaction(action: BodyAction, location: string, prefixes: [string, string][], body: string): Promise<Response>
export async function execTransaction(action: BodyAction | BodyLessAction, location: string, prefixes?: Array<[string, string]>, body?: string): Promise<Response>{
    const url = new URL(location)
    let headers = {}
    switch(action){
    case BodyAction.UPDATE: {
        headers = {
            "Content-Type": "application/sparql-update",
            "Accept": "text/plain"
        }
        body = insertQuery(body as string, prefixes !== undefined ? prefixes : [])
        break
    }
    case BodyAction.QUERY: {
        headers = {
            "Content-Type": "application/sparql-query",
        }
        break
    }
    case BodyAction.DELETE: {
        headers= {
            "Content-Type": "text/turtle",
            "Accept": "text/plain"
        }
        body = deleteQuery(body as string, prefixes !== undefined ? prefixes : [])
        break
    }
    }
    url.searchParams.set("action",action)
    const res = await fetch(url.toString(), {
        method: "PUT",
        headers: headers,
        body: body
    })
    if(!res.ok){
        throw Error(`Something went wrong executing ${body} at ${location}: ${await res.text()}\n`)
    }
    return res
}
