import active from "./active"
import writeRawData from "./writeRawData"
import userStats from "./userStats"
import userContentStats from "./userContentStats"
import getRawData from "./getRawData"
import getPrereqs from "./getPrereqs"
import writeToLearnerRecord from "./writeToLearnerRecord"
import readFromLearnerRecord from "./readFromLearnerRecord"
import getSubjects from "./getSubjects"

type Endpoints = typeof getSubjects | typeof active | typeof writeToLearnerRecord  | typeof userStats | typeof userContentStats | typeof getRawData | typeof getPrereqs | typeof writeRawData | typeof readFromLearnerRecord

const endpoints: Array<Endpoints> = [active,  writeToLearnerRecord, userStats, userContentStats, getRawData, getPrereqs, writeRawData, readFromLearnerRecord, getSubjects]

export default endpoints