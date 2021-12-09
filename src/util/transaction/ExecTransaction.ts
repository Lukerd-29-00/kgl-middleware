import fetch from "node-fetch"
import { insertQuery } from "./insertQuery"
import { Transaction } from "./Transaction"

async function ExecTransaction(transaction: Transaction): Promise<string>{
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
        const prefs = new Map<string,string>()
        prefs.set("cco","http://www.ontologyrepository.com/CommonCoreOntologies/")
        prefs.set("obo","http://purl.obolibrary.org/obo/")
        prefs.set("owl","http://www.w3.org/2002/07/owl#")
        prefs.set("rdf","http://www.w3.org/1999/02/22-rdf-syntax-ns#")
        prefs.set("xml","http://www.w3.org/XML/1998/namespace")
        prefs.set("xsd","http://www.w3.org/2001/XMLSchema#")
        prefs.set("rdfs","http://www.w3.org/2000/01/rdf-schema#")
        body = insertQuery(body, prefs)
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
        throw Error(`Something went wrong executing ${transaction.body} at ${transaction.location}: ${await res.text()}\n`)
    }
    return await res.text()
}

export default ExecTransaction