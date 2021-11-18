import {Transaction} from "./Transaction"
import ExecTransaction from "./ExecTransaction"

async function commitTransaction(location: string): Promise<string>{
    const commit: Transaction = {subj: null, pred: null, obj: null, action: "COMMIT", location: location, body: ""}
    return await ExecTransaction(commit).then(() => {
        return `Successfully commited transaction ${location}\n`
    }).catch((e: Error) => {
        throw Error(e.message)
    })
}

export default commitTransaction