import active from "./active"
import writeToLearnerRecord from "./writeToLearnerRecord"
import userStats from "./userStats"
import userContentStats from "./userContentStats"
import getRawData from "./getRawData"
import getPrereqs from "./getPrereqs"

type Endpoints = typeof active | typeof writeToLearnerRecord  | typeof userStats | typeof userContentStats | typeof getRawData | typeof getPrereqs

const endpoints: Array<Endpoints> = [active,  writeToLearnerRecord, userStats, userContentStats, getRawData, getPrereqs]

export default endpoints