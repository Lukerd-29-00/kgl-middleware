import getSubjects from "../src/endpoints/getSubjects"
import getApp from "../src/server"
import supertest from "supertest"
import {ip, prefixes} from "../src/config"
import startTransaction from "../src/util/transaction/startTransaction"
import { BodyAction, BodyLessAction, execTransaction } from "../src/util/transaction/execTransaction"
import readBehavior from "./readErrorBehavior"
import fetch from "node-fetch"
import { waitFor, expectItems } from "./util"
const port = 7204
const repo = "getSubjectsTest"

async function writeSubject(subject: string): Promise<void>{
    const location = await startTransaction(ip, repo)
    await execTransaction(BodyAction.UPDATE,location,prefixes,`<${subject}> a owl:NamedIndividual .`)
    await execTransaction(BodyLessAction.COMMIT,location)
}

describe("getSubjects",() => {
    const test = supertest(getApp(ip,repo,prefixes,[getSubjects]))
    const content = "http://aribtrarywebsite/TestContent"
    it("Should return an empty list if there are no subjects in the database", async () => {
        const res = (await test.get(getSubjects.route).expect(200)).body
        expect(res).toHaveLength(0)
    })

    it("Should return a list of all the NamedIndividuals in the database", async () => {
        await Promise.all([
            writeSubject(content),
            writeSubject(`${content}2`),
            writeSubject(`${content}3`),
            writeSubject(`${content}4`)
        ])

        await waitFor(async () => {
            const body = (await test.get(getSubjects.route).expect(200)).body
            expectItems(body,content,`${content}2`,`${content}3`,`${content}4`)
        })
    })

    afterEach(async () => {
        await fetch(`${ip}/repositories/${repo}/statements`, {
            method: "DELETE",
        })
    })
})

describe("getSubjects",() => {
    readBehavior(getSubjects.route,repo,port,supertest(getApp(`http://localhost:${port}`,repo,prefixes,[getSubjects])))
})