import active from "./active"
import writeRawData from "./writeRawData"
import userStats from "./userStats"
import userContentStats from "./userContentStats"
import getRawData from "./getRawData"
import getPrereqs from "./getPrereqs"
import writeToLearnerRecord from "./writeToLearnerRecord"

type Endpoints = typeof active | typeof writeToLearnerRecord  | typeof userStats | typeof userContentStats | typeof getRawData | typeof getPrereqs | typeof writeRawData

const endpoints: Array<Endpoints> = [active,  writeToLearnerRecord, userStats, userContentStats, getRawData, getPrereqs, writeRawData]

export default endpoints