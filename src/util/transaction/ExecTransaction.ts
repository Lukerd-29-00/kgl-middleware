import fetch, {Response} from "node-fetch"
import { insertQuery } from "./insertQuery"
import { Transaction } from "./Transaction"
import { URL } from "url"
import { deleteQuery } from "./deleteQuery"

async function ExecTransaction(transaction: Transaction, prefixes?: Array<[string, string]>): Promise<Response>{
    const url = new URL(transaction.location)
    let body = transaction.body
    let headers = {}
    if (transaction.subj !== null) {
        url.searchParams.set("subj", transaction.subj)
    }
    if (transaction.pred !== null) {
        url.searchParams.set("pred", transaction.pred)
    }
    if (transaction.obj !== null) {
        url.searchParams.set("obj", transaction.obj)
    }
    
    switch(transaction.action){
    case "UPDATE": {
        headers = {
            "Content-Type": "application/sparql-update",
            "Accept": "text/plain"
        }
        body = insertQuery(body, prefixes !== undefined ? prefixes : [])
        break
    }
    case "QUERY": {
        headers = {
            "Content-Type": "application/sparql-query",
        }
        break
    }
    case "DELETE": {
        headers= {
            "Content-Type": "text/turtle",
            "Accept": "text/plain"
        }
        body = deleteQuery(body, prefixes !== undefined ? prefixes : [])
        break
    }
    }
    url.searchParams.set("action",transaction.action)
    const res = await fetch(url.toString(), {
        method: "PUT",
        headers: headers,
        body: body
    })
    if(!res.ok){
        throw Error(`Something went wrong executing ${body} at ${transaction.location}: ${await res.text()}\n`)
    }
    return res
}

export default ExecTransaction