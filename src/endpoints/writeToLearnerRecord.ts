import { Request, Response } from "express"
import startTransaction from "../util/transaction/startTransaction"
import {execTransaction, BodyAction, BodyLessAction} from "../util/transaction/execTransaction"
import rollback from "../util/transaction/rollback"
import Joi from "joi"
import { EmptyObject, Endpoint, Locals, Method, RawData } from "../server"
import {v4 as uuid} from "uuid"


const ReqBodySchema = Joi.object({
    correct: Joi.boolean().required(),
    responseTime: Joi.when("correct",{
        is: Joi.boolean().valid(true),
        then: Joi.number().integer().unit("milliseconds").required(),
        otherwise: Joi.forbidden()
    }),
    timestamp: Joi.date().required()
})
const bodySchema = Joi.alternatives(Joi.array().items(ReqBodySchema),ReqBodySchema)

const route = "/users/:userID/data/:content"

export interface ReqParams extends Record<string,string>{
    userID: string
    content: string
}

export interface ReqBody extends Record<string, RawData>{
    responseTime: number,
    correct: boolean,
    timestamp: string
}

export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, correct: false): string
export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, correct: true, responseTime: number): string
export function createLearnerRecordTriples(userID: string, content: string, timestamp: number, correct: boolean, responseTime?: number): string {
    const id = uuid()
    const person = `cco:Person_${userID}`
    const act = `cco:Act_Learning_${id}`
    const timeNominal = `cco:Reference_Time_Act_Learning_${id}`
    const correctNominal = `cco:Correct_Nominal_Act_Learning_${id}`
    const responseTimeOrdinal = `cco:Response_Ordinal_Act_Learning_${id}`
    //Person
    let rawTriples = `${person} a cco:Person ;`
    rawTriples += `cco:agent_in ${act} .`
    //Act of Learning
    rawTriples += `${act} a cco:ActOfEducationalTrainingAcquisition ;`
    rawTriples += `cco:has_agent ${person} ;`
    rawTriples += `cco:has_object <${content}> ;`
    rawTriples += `cco:occurs_on ${timeNominal} ;`
    rawTriples += `cco:is_measured_by_nominal ${correctNominal} ;`
    rawTriples += `cco:is_measured_by_ordinal ${responseTimeOrdinal} .`
    //Time Stamp
    rawTriples += `${timeNominal} a cco:ReferenceTime ;`
    rawTriples += `cco:is_tokenized_by "${timestamp}"^^xsd:integer .`
    //Correctness
    rawTriples += `${correctNominal} a cco:NominalMeasurementInformationContentEntity ;`
    rawTriples += `cco:is_tokenized_by "${correct}"^^xsd:boolean .`
    //Response time
    if(correct){
        rawTriples += `${responseTimeOrdinal} a cco:OrdinalInformationContentEntity ;`
        rawTriples += `cco:is_tokenized_by "${responseTime}"^^xsd:integer .`
    }
    return rawTriples
}

function isReqBody(body: ReqBody | Array<ReqBody>): body is ReqBody{
    return (body as ReqBody).correct !== undefined
}

async function processWriteToLearnerRecord(request: Request<ReqParams,string,Array<ReqBody> | ReqBody,EmptyObject>, response: Response<string,Locals>, next: (e?: Error) => void, ip: string, repo: string, prefixes: Array<[string, string]>): Promise<void> {
    const promises = new Array<Promise<void>>()
    const location = await startTransaction(ip, repo).catch((e: Error) => {
		next(e)
	})
	//Terminate the function if starting the transaction failed.
	if(location === undefined){
		return
	}
    if(isReqBody(request.body)){
        let triples: undefined | string
        if(request.body.correct){
            triples = createLearnerRecordTriples(request.params.userID,request.params.content,new Date(request.body.timestamp).getTime(),true,request.body.responseTime)
        }else{
            triples = createLearnerRecordTriples(request.params.userID,request.params.content,new Date(request.body.timestamp).getTime(),false)
        }
        promises.push(writeToLearnerRecord(location,prefixes,triples))
    }else{
        for(const statement of request.body){
            const userID = request.params.userID
            const timestamp = new Date(statement.timestamp).getTime()
            const content = request.params.content
            const correct = statement.correct
            const responseTime = statement.responseTime
            let tmp2: undefined | string
            if(correct){
                tmp2 = createLearnerRecordTriples(userID, content, timestamp,true,responseTime)
            }else{
                tmp2 = createLearnerRecordTriples(userID, content, timestamp,false)
            }
            const triples = tmp2 as string
            promises.push(writeToLearnerRecord(location,prefixes,triples))
        }
        
    }
    Promise.all(promises).then(async () => {
        return await execTransaction(BodyLessAction.COMMIT,location).then(() => {
            response.status(202)
            next()
        })
    }).catch((e: Error) => {
        rollback(location).then(() => {
            next(e)
        }).catch(e2 => {
            const err = Error(`Failed rollback: ${e2} after error: ${e}`)
            next(err)
        })
    })

}

async function writeToLearnerRecord(location: string, prefixes: Array<[string, string]>, triples: string): Promise<void> {
    await execTransaction(BodyAction.UPDATE,location,prefixes,triples)
}
const endpoint: Endpoint<ReqParams,string,ReqBody[] | ReqBody,EmptyObject,Locals> = { 
	method: Method.PUT,
	schema: {body: bodySchema},
	 route, process: processWriteToLearnerRecord 
}
export default endpoint