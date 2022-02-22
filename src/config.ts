import {v4 as uuid} from "uuid"
export const ip = "http://localhost:7200"
export const defaultRepo = "LearnerRecordsTesting"
export const prefixes: Array<[string, string]> = [["cco", "http://www.ontologyrepository.com/CommonCoreOntologies/"]]
export const port = 4000
export const production = false
export const logPath = `log/session${uuid()}.log`