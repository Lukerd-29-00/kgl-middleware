import fs from "fs"
import { readdir } from "fs/promises"
import fetch from "node-fetch"
import {ip} from "../src/config"
import formData from "form-data"

export default async function setup(): Promise<void>{
    const dirpromise = getFiles()
    await fetch(`${ip}/rest/repositories`).catch((e: Error) => {
        throw Error(`Could not connect to graphdb! make sure graphdb is running at ${ip} before testing! exact error: ${e.message}.`)
    })
    const files = await dirpromise
    await fs.readFile("./test/testRepository.ttl",(err, data) => {
        if(err){
            throw Error(`Interrupted after reading ${data.length} bytes by error: ${err.message}`)
        }

        for(const file of files){
            const config = data.toString().replace(/rep:repositoryID "test" ;/,`rep:repositoryID "${file}Test" ;`)
            fs.writeFileSync(`./${file}Config.ttl`,config)
            const form = new formData()
            const readStream = fs.createReadStream(`./${file}Config.ttl`)
            form.append("config",readStream)
            fetch(`${ip}/rest/repositories`, {
                method: "POST",
                body: form
            })
        }
    })
    const spins = new Array<Promise<void>>()
    for(const file of files){
        spins.push(spin(file, true))
    }
    await Promise.all(spins)
}

export async function getFiles(): Promise<string[]>{
    const files = await readdir("./test")
    const output = new Array<string>()
    for(const file of files){
        const match = /(.*)\.test\.ts$/.exec(file)
        if(match !== null){
            output.push(match[1])
        }
    }
    return output
}

export async function spin(file: string, present: boolean): Promise<void>{
    const start = new Date().getTime()
    let reply = await fetch(`${ip}/rest/repositories/${file}Test`)
    while(!present ? reply.ok : !reply.ok){
        reply = await fetch(`${ip}/rest/repositories/${file}Test`)
        if(new Date().getTime() - start >= 60000){
            throw Error("Could not create test repository! did graphdb close during testing? If not, check to make sure it is responding.")
        }
    }
    if(present){
        await fs.rm(`./${file}Config.ttl`,(err) => {
            if(err){
                console.log(`Warning: failed to delete file ${file}Config.ttl because of error: ${err.message}`)
            }
        })
    }
    
}



