import fetch from "node-fetch"
import Joi from "joi"
import {Command} from "commander"
import fs, { ReadStream } from "fs"
import startTransaction from "../src/util/transaction/startTransaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import rollback from "../src/util/transaction/Rollback"
import formData from "form-data"
import { Transaction } from "../src/util/transaction/Transaction"

export async function spin(server: string, repositoryId: string, present: boolean, configFile: string): Promise<void>{
    const start = new Date().getTime()
    let reply = await fetch(`${server}/rest/repositories/${repositoryId}`)
    while(!present ? reply.ok : !reply.ok){
        reply = await fetch(`${server}/rest/repositories/${repositoryId}`)
        if(new Date().getTime() - start >= 60000){
            throw Error("Could not create test repository! did graphdb close during testing? If not, check to make sure it is responding.")
        }
    }
    if(present){
        await fs.rm(`./${configFile}`,(err) => {
            if(err){
                console.log(`Warning: failed to delete file ${configFile} because of error: ${err.message}`)
            }
        })
    }
    
}


const program = new Command()

const args = program.version("1.0.0")
.requiredOption("-c, --content", "The named individuals of the specific concepts being mastered")
.requiredOption("-r, --repository", "The repository that should contain the data")
.requiredOption("-o, --ontology", "The file containing the ontology of all the things being learned")
.requiredOption("-s, --server", "The address of the server")
.requiredOption("-c, --config", "The ttl file pointing to the configuration of the new repository", "./test/testRepository.ttl")
.parse()
.opts()

const verifiedArgs: Args = {
    content: args.content,
    repository: args.repository,
    ontology: args.ontology,
    server: args.server,
    config: args.config
}

const argsSchema = Joi.object({
    content: Joi.string().required().regex(/.*\.ttl$/),
    repository: Joi.string().required(),
    ontology: Joi.string().required().regex(/.*\.ttl$/),
    server: Joi.string().required()
})

const valid = argsSchema.validate(verifiedArgs)

if(valid.error !== undefined){
    throw Error(valid.error.message)
}

interface Args{
    repository: string,
    content: string,
    ontology: string,
    server: string,
    config: string
}

async function createRepository(name: string, configFileName: string, server: string): Promise<void>{
    await fs.readFile("./test/testRepository.ttl",(err, data) => {
        if(err){
            throw Error(`Interrupted after reading ${data.length} bytes by error: ${err.message}`)
        }
        const config = data.toString()
        .replace(/rep:repositoryID ".*"/,`rep:repositoryID "${configFileName}"`)
        .replace(/rdfs:label ".*"/, `rdfs:label "${configFileName}"`)
        fs.writeFileSync(`./$config.ttl`,config)
        let form = new formData()
            const readStream = fs.createReadStream(`./config.ttl`)
            form.append("config",readStream)
            fetch(`${server}/rest/repositories`, {
                method: "POST",
                body: form
            })
    })
}

async function uploadKibibyteOfFile(block: string, server: string, repository: string): Promise<void>{
    const location = await startTransaction(server, repository)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        action: "UPDATE",
        body: block,
        location: location
    }
    await ExecTransaction(transaction).catch((e: Error) => {
        rollback(location)
        throw Error(e.message)
    })

    await commitTransaction(location).catch((e: Error) => {
        rollback(location)
        throw Error(e.message)
    })
}

async function uploadTriplesFromFile(file: string, server: string, repository: string): Promise<void>{
    const size = fs.statSync(file).size
    const numBlocks = Math.floor(size/1024)
    const promises = new Array<Promise<void>>()
    let start = 0
    for(let i = 0; i < numBlocks; i++){
        constraw.match(/(^.*) \.(?:(?!.* \.))/)
        promises.push(uploadKibibyteOfFile(fs.createReadStream(file,{start: start, end: 1024+i*1024}).read(),server,repository))

    }

}

async function setup(args: Args): Promise<void>{
    await fetch(`${args.server}/rest/repositories`).catch((e: Error) => {
        throw Error(`Could not connect to graphdb! make sure graphdb is running at ${args.server} before testing! exact error: ${e.message}.`)
    })

    await createRepository(args.repository, args.config, args.server)

    await spin(args.server, args.repository, true, args.config)

    fs.statSync(args.content)

}

