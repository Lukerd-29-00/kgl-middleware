import SparqlQueryGenerator from "../util/QueryGenerators/SparqlQueryGenerator"
import ExecTransaction from "../util/transaction/ExecTransaction"
import startTransaction from "../util/transaction/startTransaction"
import {Transaction} from "../util/transaction/Transaction"
import Joi from "joi"
import {Request, Response} from "express"
import {Endpoint} from "../server"

const route = "/attempts"

const schema = Joi.object(
    {
        userID: Joi.string().required(),
        content: Joi.string().required()
    }
)

export function getNumberAttemptsQuery(userID: string, contentIRI: string, prefixes: [string, string][]): string{
    return SparqlQueryGenerator({query: `
        cco:Person_${userID} cco:agent_in ?p .
        ?p cco:has_object <${contentIRI}> ;
    		cco:is_measured_by_nominal / cco:is_tokenized_by ?c .
    `, targets: ["(count(?c) as ?x)"]},prefixes)
}
type ReqBody = {
    userID: string,
    content: string
}

export async function getNumberAttempts(ip: string, repo: string, prefixes: [string, string][], request: ReqBody): Promise<number>{
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        location,
        body: getNumberAttemptsQuery(request.userID,request.content,prefixes),
        action: "QUERY"
    }

    return new Promise<number>((resolve, reject) => {
        ExecTransaction(transaction,prefixes).then((response: string) => {
            const match = response.match(/^(\d+)$/m)
            if(match !== null){
                resolve(parseInt(match[1],10))
            }else{
                reject()
            }
        }).catch((e: Error) => {
            reject(e.message)
        })
    })
}



export async function processRead<T extends Record<string, string | number | boolean>>(request: Request<Record<string,string>,string,T>, response: Response<string>, ip: string, repo: string, prefixes: [string, string][], getProperty: (ip: string, repo: string, prefixes: [string, string][], request: T) => Promise<string | number | boolean>): Promise<void>{
    getProperty(ip, repo, prefixes, request.body).then((output: string | number | boolean) => {
        response.send(output.toString())
    }).catch((e: Error) => {
        response.status(500)
        response.send(e.message)
    })
}

const endpoint: Endpoint = {
    process: (request: Request, response: Response<string>, ip: string, repo: string, prefixes: [string, string][]) => {
        processRead(request, response, ip, repo, prefixes, getNumberAttempts)
    },
    schema,
    route,
    method: "put"
}
export default endpoint
