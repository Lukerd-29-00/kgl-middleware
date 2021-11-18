import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import rollback from "../util/transaction/Rollback"
import { Transaction } from "../util/transaction/Transaction"
import SparqlQueryGenerator from "../../QueryGenerators/SparqlQueryGenerator"

async function isPresent(userID: string, ip: string, repo: string, location?: string): Promise<boolean> {
    if(location === undefined){
        location = await startTransaction(ip, repo)
    } else{
        location = `${ip}/repositories/${repo}/transactions/${location}`
    }
    const query = await SparqlQueryGenerator({query: `cco:Person_${userID} rdf:type ?c.`, targets: ["?c"]})
    const exec: Transaction = {action: "QUERY", subj: null, pred: null, obj: null, location: location, body: query}
    return ExecTransaction(exec).then((value: string) => {
        const output = value.split(/\n/)
        return output.length === 3
    }).catch((e: Error) => {
        rollback(location as string)
        throw Error(e.message)
    })
}

export default isPresent