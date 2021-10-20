import {ip, defaultRepo} from "../../globals"
import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import rollback from "../util/transaction/Rollback"
import commitTransaction from "../util/transaction/commitTransaction"
import { Transaction } from "../util/transaction/Transaction"
import SparqlQueryGenerator from "../../QueryGenerators/SparqlQueryGenerator"

async function isPresent(userID: string, location?: string): Promise<boolean> {
    if(location === undefined){
        location = await startTransaction(defaultRepo)
    }
    else{
        location = `${ip}/repositories/${defaultRepo}/transactions/${location}`
    }
    const query = await SparqlQueryGenerator({graphQueries: [[`${ip}/Person_${userID}`,"?person a cco:Person ."]], query: null, targets: ["?person"]})
    let exec: Transaction = {action: "QUERY", subj: null, pred: null, obj: null, graph: `${ip}/Person_${userID}`,location: location, body: query}
    return (ExecTransaction(exec).then((value: string) => {
        let output = value.split(/\n/)
        return output.length === 3
    }).catch((e: Error) => {
        rollback(location)
        throw Error(e.message)
    }))
}

export default isPresent