import { getNumberAttemptsQuery } from "./attempts"
import startTransaction from "../util/transaction/startTransaction"
import {Transaction} from "../util/transaction/Transaction"
import ExecTransaction from "../util/transaction/ExecTransaction"

export function getNumberCorrectQuery(userID: string, contentIRI: string, prefixes: [string, string][]): string{
    return getNumberAttemptsQuery(userID,contentIRI,prefixes).replace("}","FILTER(?c=\"true\"^^xsd:boolean)\n}")
}

export async function getNumberCorrectAttempts(ip: string, repo: string, userID: string, contentIRI: string, prefixes: [string, string][]): Promise<number>{
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        location,
        body: getNumberCorrectQuery(userID,contentIRI,prefixes),
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