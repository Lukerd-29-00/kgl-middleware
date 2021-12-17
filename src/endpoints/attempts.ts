import SparqlQueryGenerator from "../util/QueryGenerators/SparqlQueryGenerator"
import ExecTransaction from "../util/transaction/ExecTransaction"
import startTransaction from "../util/transaction/startTransaction"
import {Transaction} from "../util/transaction/Transaction"

export function getNumberAttemptsQuery(userID: string, contentIRI: string, prefixes: [string, string][]): string{
    return SparqlQueryGenerator({query: `
        cco:Person_${userID} cco:agent_in ?p .
        ?p cco:has_object <${contentIRI}> ;
    		cco:is_measured_by_nominal / cco:is_tokenized_by ?c .
    `, targets: ["(count(?c) as ?x)"]},prefixes)
}

export async function getNumberAttempts(ip: string, repo: string, userID: string, contentIRI: string, prefixes: [string, string][]): Promise<number>{
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        location,
        body: getNumberAttemptsQuery(userID,contentIRI,prefixes),
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

