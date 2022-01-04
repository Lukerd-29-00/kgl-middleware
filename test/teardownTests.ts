import fetch from "node-fetch"
import {ip} from "../src/config"
import { getFiles, spin} from "./setupTests"

export default async function teardown(): Promise<void>{
    const files = await getFiles()
    const promises = []
    for(const file of files){
        promises.push(fetch(`${ip}/rest/repositories/${file}Test`,{
            method: "DELETE"
        }).catch((e: Error) => {
            throw Error(`Could remove the test repository after testing! exact error was: ${e.message}`)
        }))
    }
    await Promise.all(promises)
    const spins = new Array<Promise<void>>()
    for(const file of files){
        spins.push(spin(file, false))
    }
    await Promise.all(spins)
}