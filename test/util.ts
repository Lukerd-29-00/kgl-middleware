import supertest from "supertest"
import startTransaction from "../src/util/transaction/startTransaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import {createLearnerRecordTriples} from "../src/endpoints/writeToLearnerRecord"
import {Transaction} from "../src/util/transaction/Transaction"
import {ip, prefixes} from "../src/config"
import writeToLearnerRecord from "../src/endpoints/writeToLearnerRecord"

interface ResBody{
    correct: number,
    attempts: number
}

export async function writeAttemptTimed(repo: string, userID: string, content: string, time: Date, correct: boolean, responseTime: number){
    const location = await startTransaction(ip, repo)
    const triples = createLearnerRecordTriples(userID, content,time.getTime(),correct,responseTime)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        location: location,
        body: triples,
        action: "UPDATE"
    }
    await ExecTransaction(transaction,prefixes)
    await commitTransaction(location)
}

export async function writeAttempt(repo: string, userID: string, content: string, correct: boolean, responseTime: number, count: number = 1): Promise<void>{
    const location = await startTransaction(ip, repo)
    for(let i = 0; i < count; i++){
        const triples = createLearnerRecordTriples(userID,content,new Date().getTime(),correct, responseTime)
        const transaction: Transaction = {
            subj: null,
            pred: null,
            obj: null,
            location: location,
            body: triples,
            action: "UPDATE"
        }
        await ExecTransaction(transaction,prefixes)
    }
    await commitTransaction(location)
}

export async function waitFor(callback: () => Promise<void> | void, timeout: number = 5000, waitPeriod: number = 15): Promise<void>{
    const timeoutId = setTimeout(() =>{
        clearTimeout(timeoutId)
        throw Error(`waitFor timed out after ${timeout}ms`)
    },timeout)
    while(true){
        try{
            await callback()
            break
        }catch(e){
            await new Promise((resolve) => {
                setTimeout(resolve,waitPeriod)
            })
        }
    }
    clearTimeout(timeoutId)
}

interface QueryStatsKwargs{
    content?: string,
    since?: Date,
    before?: Date,
    mean?: boolean,
    median?: boolean,
    stdev?: boolean
}

function isDate(x: Date | string | boolean): x is Date{
    return (x as Date).getTime !== undefined
}

export async function queryStats(route: string, test: supertest.SuperTest<supertest.Test>, userID: string, kwargs?: QueryStatsKwargs): Promise<Record<string, number | ResBody>>{
    route = route.replace(":userID",userID)
    if(kwargs !== undefined && kwargs.content !== undefined){
        route = route.replace(":content",encodeURIComponent(kwargs.content))
    }
    if(kwargs === undefined){
        return (await test.get(route).set("Date",new Date().toUTCString()).expect(200)).body
    }else{
        let url = route
        let queryMarker = "?"
        for(const entry of Object.entries(kwargs)){
            if(entry[1] !== undefined && entry[0] !== "content"){
                if(isDate(entry[1])){
                    url += `${queryMarker}${entry[0]}=${encodeURIComponent(entry[1].getTime())}`
                }else{
                    url += `${queryMarker}${entry[0]}=${encodeURIComponent(entry[1])}`
                }
                queryMarker = "&"
            }
        }
        return (await test.get(url).set("Date",new Date().toUTCString()).expect(200)).body
    }
}

export interface TimeInterval{
    since?: Date,
    before?: Date
}

export async function queryWrite(test: supertest.SuperTest<supertest.Test>, userID: string, content: string, timestamp: Date, correct: boolean, responseTime: number): Promise<void>{
    const route = writeToLearnerRecord.route.replace(":userID",userID).replace(":content",encodeURIComponent(content))
    const body = {correct, responseTime}
    await test.put(route).set("Content-Type","application/json").set("Date",timestamp.toUTCString()).send(body).expect(202)
}