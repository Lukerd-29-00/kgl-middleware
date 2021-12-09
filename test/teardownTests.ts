import fetch from "node-fetch"
import {ip} from "../src/config"
import { getFiles, spin} from "./setupTests"

export default async function teardown(): Promise<void>{
    const files = await getFiles()
    for(const file of files){
        fetch(`${ip}/rest/repositories/${file}Test`,{
            method: "DELETE"
        }).catch((e: Error) => {
            throw Error(`Could remove the test repository after testing! exact error was: ${e.message}`)
        })
    }
    const spins = new Array<Promise<void>>()
    for(const file of files){
        spins.push(spin(file, false))
    }
    await Promise.all(spins)
}