import {ip, defaultRepo} from "../../globals"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import rollback from "../util/transaction/Rollback"
import { Transaction } from "../util/transaction/Transaction"
import SparqlQueryGenerator from "../../QueryGenerators/SparqlQueryGenerator"

async function isPresent(userID: string, location?: string): Promise<boolean> {
    if(location === undefined){
        location = await startTransaction(defaultRepo)
    }
    else{
        location = `${ip}/repositories/${defaultRepo}/transactions/${location}`
    }
    const query = await SparqlQueryGenerator({query: `cco:Person_${userID} rdf:type ?c.`, targets: ["?c"]})
    let exec: Transaction = {action: "QUERY", subj: null, pred: null, obj: null, location: location, body: query}
    return (ExecTransaction(exec).then((value: string) => {
        let output = value.split(/\n/)
        return output.length === 3
    }).catch((e: Error) => {
        rollback(location as string)
        throw Error(e.message)
    }))
}

export default isPresent