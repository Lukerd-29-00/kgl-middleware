import active from "./active"
import writeToLearnerRecord from "./writeToLearnerRecord"
import userStats from "./userStats"
import userContentStats from "./userContentStats"
import getRawData from "./getRawData"

type Endpoints = typeof active | typeof writeToLearnerRecord  | typeof userStats | typeof userContentStats | typeof getRawData

const endpoints: Array<Endpoints> = [active,  writeToLearnerRecord, userStats, userContentStats, getRawData]

export default endpoints