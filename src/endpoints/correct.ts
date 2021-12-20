import { getNumberAttemptsQuery, processRead } from "./attempts"
import startTransaction from "../util/transaction/startTransaction"
import {Transaction} from "../util/transaction/Transaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import Joi from "joi"
import { Endpoint } from "../server"
import {Request, Response} from "express"

export function getNumberCorrectQuery(userID: string, contentIRI: string, prefixes: [string, string][]): string{
    return getNumberAttemptsQuery(userID,contentIRI,prefixes).replace("}","FILTER(?c=\"true\"^^xsd:boolean)\n}")
}

const route = "/correct"

const schema = Joi.object({
    userID: Joi.string().required(),
    content: Joi.string().required()
})

type ReqBody = {
    userID: string,
    content: string
}

export async function getNumberCorrectAttempts(ip: string, repo: string, prefixes: [string, string][], req: ReqBody): Promise<number>{
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        location,
        body: getNumberCorrectQuery(req.userID,req.content,prefixes),
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

const endpoint: Endpoint = {
    process: (request: Request, response: Response, ip: string, repo: string, prefixes: [string, string][]) => {
        processRead(request,response,ip,repo,prefixes,getNumberCorrectAttempts)
    },
    route,
    schema,
    method: "put"
}
export default endpoint