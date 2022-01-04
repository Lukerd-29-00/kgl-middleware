import active from "./active"
import { Endpoint } from "../server"
import writeToLearnerRecord from "./writeToLearnerRecord"
import readFromLearnerRecord from "./readFromLearnerRecord"

const endpoints: Array<Endpoint> = [active,  writeToLearnerRecord, readFromLearnerRecord]

export default endpoints