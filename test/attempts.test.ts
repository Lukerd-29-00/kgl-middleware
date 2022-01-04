import supertest from "supertest"
import getApp from "../src/server"
import attempts, {getNumberAttempts} from "../src/endpoints/attempts"
import {Transaction} from "../src/util/transaction/Transaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import startTransaction from "../src/util/transaction/startTransaction"
import {ip, prefixes} from "../src/config"
import endpoints from "../src/endpoints/endpoints"
import { createLearnerRecordTriples } from "../src/endpoints/writeToLearnerRecord"
import fetch from "node-fetch"
import {Server} from "http"

const repo = "attemptsTest"

async function expectAttempts(attempts: number, userID: string, content: string, prefixes: [string, string][]): Promise<void>{
    while(await getNumberAttempts(ip,repo,prefixes,{userID, content}) !== attempts){
        await new Promise((resolve) => {
            setTimeout(resolve,100)
        })
    }
}

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

describe("attempts", () => {
    it("Should report 0 if the user does not exist", async () => {
        const test = supertest(getApp(ip, repo,prefixes, endpoints))
        const output = await test.put(attempts.route).set("Content-Type","application/json").send({"userID": "12345", content: "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"}).expect(200)
        expect(output.text).toBe("0")
    })
    it("Should report the number of attempts made", async () => {
        const test = supertest(getApp(ip,repo,prefixes,endpoints))
        const userID = "12345"
        const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent"
        const body = {
            userID,
            content
        }
        await writeAttempt(userID,content,false)
        await expectAttempts(1,userID,content,prefixes)
        const output = await test.put(attempts.route).set("Content-Type","application/json").send(body).expect(200)
        expect(output.text).toBe("1")
    })
    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`,{
            method: "DELETE",
        })
    })
})

describe("attempts", () => {
    let server: null | Server = null
    const userID = "1234"
    const content = "http://www.ontologyrepository.com/CommonCoreOntologies/testContent2"
    const timestamp = new Date().getTime()
    const correct = false
    const body = {
        userID,
        standardLearnedContent: content,
        correct,
        timestamp
    }
    const mockTransaction = "ab642438bc4aacdvq"
    const transactions = `/repositories/${repo}/transactions`
    const location = `${transactions}/${mockTransaction}`
    it("Should send a server error if it cannot start a transaction", async () => {
        const test = supertest(getApp("http://1",repo,prefixes,endpoints))
        await test.put(attempts.route)
    })
})