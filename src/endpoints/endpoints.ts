import active from "./active"
import writeToLearnerRecord from "./writeToLearnerRecord"
import readFromLearnerRecord from "./readFromLearnerRecord"

export type Endpoints = typeof active | typeof writeToLearnerRecord  | typeof readFromLearnerRecord

const endpoints: Array<Endpoints> = [active,  writeToLearnerRecord, readFromLearnerRecord]

export default endpoints