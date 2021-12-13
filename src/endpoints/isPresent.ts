import { Request, Response } from "express"
import startTransaction from "../util/transaction/startTransaction"
import { Transaction } from "../util/transaction/Transaction"
import SparqlQueryGenerator from "../util/QueryGenerators/SparqlQueryGenerator"
import ExecTransaction from "../util/transaction/ExecTransaction"
import rollback from "../util/transaction/Rollback"
import Joi from "joi"
import { Endpoint } from "../server"

const schema = Joi.object({
    userID: Joi.string(),
    transactionID: Joi.string().optional()
})

const route = "/isPresent"

async function processIsPresent(request: Request, response: Response, ip: string, repo: string, prefixes: Array<[string, string]>): Promise<void>{
    isPresent(request.body.userID,ip, repo, request.body.transactionID,).then((output: boolean) => {
        if(output){
            response.send("")
        } else{
            response.status(404)
            response.send("")
        }

    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })
}

async function isPresent(userID: string, ip: string, repo: string, prefixes: Array<[string, string]>, location?: string): Promise<boolean> {
    if(location === undefined){
        location = await startTransaction(ip, repo)
    } else{
        location = `${ip}/repositories/${repo}/transactions/${location}`
    }
    const query = SparqlQueryGenerator({query: `cco:Person_${userID} rdf:type ?c.`, targets: ["?c"]},prefixes)
    const exec: Transaction = {action: "QUERY", subj: null, pred: null, obj: null, location: location, body: query}
    return ExecTransaction(exec,prefixes).then((value: string) => {
        const output = value.split(/\n/)
        return output.length === 3
    }).catch((e: Error) => {
        rollback(location as string)
        throw Error(e.message)
    })
}

const endpoint: Endpoint = {route, schema, process: processIsPresent, method: "put"}
export default endpoint