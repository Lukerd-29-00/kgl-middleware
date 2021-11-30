import fs from "fs"
import fetch from "node-fetch"
import {ip} from "../src/config"
import formData from "form-data"

export default async function setup(): Promise<void>{
    await fetch(`${ip}/rest/repositories`).catch((e: Error) => {
        throw Error(`Could not connect to graphdb! make sure graphdb is running at ${ip} before testing! exact error: ${e.message}.`)
    })
    const data = new formData()
    const readStream = fs.createReadStream("./test/testRepository.ttl")
    data.append("config",readStream)
    await fetch(`${ip}/rest/repositories`, {
        method: "POST",
        body: data,
        
    })
    let reply = await fetch(`${ip}/rest/repositories/test`)
    const start = new Date().getTime()
    //ensure we do not procede to the tests unless the test repository is actually present.
    while(!reply.ok){
        reply = await fetch(`${ip}/rest/repositories/test`)
        if(new Date().getTime() - start >= 60000){
            throw Error("Could not create test repository! was graphdb closed? If not, check to make sure the programm is responding.")
        }
    }
}





