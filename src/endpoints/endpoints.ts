import active from "./active"
import commit from "./commit"
import rollback from "./rollback"
import isPresent from "./isPresent"
import { Endpoint } from "../server"
import writeToLearnerRecord from "./writeToLearnerRecord"
import readFromLearnerRecord from "./readFromLearnerRecord"

const endpoints: Array<Endpoint> = [active, commit, rollback, isPresent, writeToLearnerRecord, readFromLearnerRecord]

export default endpoints