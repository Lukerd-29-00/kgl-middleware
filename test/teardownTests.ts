import fetch from "node-fetch"
import {ip} from "../src/config"

export default async function teardown(): Promise<void>{
    await fetch(`${ip}/rest/repositories/test`,{
        method: "DELETE"
    }).catch((e: Error) => {
        throw Error(`Could remove the test repository after testing! exact error was: ${e.message}`)
    })
    const start = new Date().getTime()
    let reply = await fetch(`${ip}/rest/repositories/test`)
    while(reply.ok){
        reply = await fetch(`${ip}/rest/repositories/test`)
        if(new Date().getTime() - start >= 60000){
            throw Error("Could not delete test repository! did graphdb close during testing? If not, check to make sure it is responding.")
        }
    }
}