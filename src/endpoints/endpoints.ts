import active from "./active"
import { Endpoint } from "../server"
import writeToLearnerRecord from "./writeToLearnerRecord"
import getAttempts from "./attempts"
import getCorrect from "./correct"

const endpoints: Array<Endpoint> = [active,  writeToLearnerRecord, getAttempts, getCorrect]

export default endpoints