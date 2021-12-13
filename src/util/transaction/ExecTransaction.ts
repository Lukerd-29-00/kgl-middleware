import fetch from "node-fetch"
import { insertQuery } from "./insertQuery"
import { Transaction } from "./Transaction"
import { URL } from "url"

async function ExecTransaction(transaction: Transaction, prefixes?: Array<[string, string]>): Promise<string>{
    const url = new URL(transaction.location)
    let body = transaction.body
    let headers = {}
    if(transaction.subj !== null){
        url.searchParams.set("subj",transaction.subj)
    }
    if(transaction.pred !== null){
        url.searchParams.set("pred",transaction.pred)
    }
    if(transaction.obj !== null){
        url.searchParams.set("obj",transaction.obj)
    }
    url.searchParams.set("action",transaction.action)
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
    }
    const res = await fetch(url.toString(), {
        method: "PUT",
        headers: headers,
        body: body
    })
    if(!res.ok){
        throw Error(`Something went wrong executing ${body} at ${transaction.location}: ${await res.text()}\n`)
    }
    return await res.text()
}

export default ExecTransaction