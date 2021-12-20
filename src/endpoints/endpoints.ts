import active from "./active"
import commit from "./commit"
import rollback from "./rollback"
import isPresent from "./isPresent"
import { Endpoint } from "../server"
import writeToLearnerRecord from "./writeToLearnerRecord"
import readFromLearnerRecord from "./readFromLearnerRecord"
import getAttempts from "./attempts"
import getCorrect from "./correct"

const endpoints: Array<Endpoint> = [active, commit, rollback, isPresent, writeToLearnerRecord, readFromLearnerRecord, getAttempts, getCorrect]

export default endpoints