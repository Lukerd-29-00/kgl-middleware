import startTransaction from "../src/util/transaction/startTransaction";
import {ip, prefixes} from "../src/config"
import { createLearnerRecordTriples } from "../src/endpoints/writeToLearnerRecord";
import { Transaction } from "../src/util/transaction/Transaction";
import ExecTransaction from "../src/util/transaction/ExecTransaction";
import commitTransaction from "../src/util/transaction/commitTransaction";
import getApp from "../src/server"
import endpoints from "../src/endpoints/endpoints"
import supertest from "supertest"
import correct from "../src/endpoints/correct"
import { getNumberAttempts } from "../src/endpoints/attempts";
import fetch from "node-fetch"

const repo = "correctTest"

async function writeAttempt(userID: string,content: string,correct: boolean): Promise<void>{
    const location = await startTransaction(ip, repo)
    const triples = createLearnerRecordTriples(userID,content,new Date().getTime(),correct)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        action: "UPDATE",
        location,
        body: triples
    }
    await new Promise<void>((resolve, reject) => {
        ExecTransaction(transaction, prefixes).then(() => {
            commitTransaction(location).then(() => {
                resolve()
            }).catch((e: Error) => {
                reject(e.message)
            })
        }).catch((e: Error) => {
            reject(e.message)
        })
    }) 
}

describe("correct", () => {
    const userID = "12345"
    const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
    it("Should return a zero if the person has not gotten anything correct", async () => {
        const test = supertest(getApp(ip,repo,prefixes,endpoints))
        const res = await test.put(correct.route).set("Content-Type","application/json").send({userID, content}).expect(200)
        expect(res.text).toBe("0")
    })
    it("Should return the number of correct answers", async () => {
        const test = supertest(getApp(ip,repo,prefixes,endpoints))
        await writeAttempt(userID,content,true)
        let res = await test.put(correct.route).set("Content-Type","application/json").send({userID,content}).expect(200)
        while(res.text !== "1"){
            res = await test.put(correct.route).set("Content-Type","application/json").send({userID,content}).expect(200)
            await new Promise((resolve) => {
                setTimeout(resolve,100)
            })
        }
        await writeAttempt(userID,content,true)
        await writeAttempt(userID,content,true)
        while(res.text !== "3"){
            res = await test.put(correct.route).set("Content-Type","application/json").send({userID,content}).expect(200)
            await new Promise((resolve) => {
                setTimeout(resolve, 100)
            })
        }

    })
    it("Should not count incorrect answers", async () => {
        await Promise.all([writeAttempt(userID,content,false),
        writeAttempt(userID,content,true),
        writeAttempt(userID,content,true),
        writeAttempt(userID,content,false),
        writeAttempt(userID,content,true)])
        while(await getNumberAttempts(ip, repo, prefixes, {userID, content}) !== 5){
            await new Promise((resolve) => {
                setTimeout(resolve,100)
            })
        }
        const test = supertest(getApp(ip,repo,prefixes,endpoints))
        const res = await test.put(correct.route).set("Content-Type","application/json").send({userID,content}).expect(200)
        expect(res.text).toBe("3")
    }, 60000)
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`,{
            method: "DELETE",
        })
    })
})