import startTransaction from "../util/transaction/startTransaction"
import ExecTransaction from "../util/transaction/ExecTransaction"
import { Transaction } from "../util/transaction/Transaction"
import rollback from "../util/transaction/Rollback"
import {ip} from "../../globals"
import {rdf} from "rdf-namespaces"

interface personAddTransaction extends Transaction {
    action: "UPDATE",
    subj: null,
    pred: null,
    obj: null,
    graph: string
}

async function addPerson(userID: string, repo: string): Promise<string>{
    const location = await startTransaction(repo)
    const body = `cco:Person_${userID} <${rdf.type}> cco:Person .`
    const transaction: personAddTransaction = {subj: null, pred: null, obj: null, action: "UPDATE", graph: `${ip}/Person_${userID}`,location: location,body: body}
    return await ExecTransaction(transaction).then(
        async (value: void) => {
            const loc = location.split(/\//g)
            return `Successfully created transaction# ${loc[loc.length-1]}\n`
        }
    ).catch(async (e: Error) => {
        const output = await rollback(location).then((value: void) => {return undefined}).catch((e: Error) => {return e.message})
        throw Error(output === undefined ? e.message : `Failed rollback after error: ${e.message}`)
    })
}

export default addPerson