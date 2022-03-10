import {v4 as uuid} from "uuid"
export const ip = "http://localhost:7200"
export const defaultRepo = "LearnerRecordsTesting"
export const prefixes: Array<[string, string]> = [["cco", "http://www.ontologyrepository.com/CommonCoreOntologies/"],["owl","http://www.w3.org/2002/07/owl#"]]
export const port = 4000
export const production = false
export const logPath = `log/session${uuid()}.log`
export const frontEndIp = "http://localhost:3000"