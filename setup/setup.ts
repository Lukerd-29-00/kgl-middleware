import fetch from "node-fetch"
import Joi from "joi"
import {Command} from "commander"
import fs from "fs"
import startTransaction from "../src/util/transaction/startTransaction"
import ExecTransaction from "../src/util/transaction/ExecTransaction"
import commitTransaction from "../src/util/transaction/commitTransaction"
import rollback from "../src/util/transaction/Rollback"
import formData from "form-data"
import { Transaction } from "../src/util/transaction/Transaction"

function getPrefixes(triples: string): Array<[string, string]>{
    const prefs = new Array<[string, string]>()
    const re = /(?:@prefix | PREFIX )(.*:) <([^>]*)> \./g
    let matches = triples.matchAll(re)
    for(let entry = matches.next(); !entry.done; entry = matches.next()){
        prefs.push([entry.value[1],entry.value[2]])
    }
    return prefs
}

/**
 * Spin waits until the repository is or is not present, depending on the present argument.
 * @param server The graphdb server
 * @param repositoryId The repository that is being deleted or created
 * @param present Whether to wait for the repository to be present or deleted
 * @param configFile The configuration file used to create the repository. The file will be deleted.
 * @async
 */
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
        await fs.rm(`./config.ttl`,(err) => {
            if(err){
                console.log(`Warning: failed to delete file ${configFile} because of error: ${err.message}`)
            }
        })
    }
    
}


const program = new Command()

const args = program.version("1.0.0")
.requiredOption("-c, --content <file>", "The named individuals of the specific concepts being mastered")
.requiredOption("-r, --repository <id>", "The repository that should contain the data")
.requiredOption("-o, --ontology <file>", "The file containing the ontology of all the things being learned")
.requiredOption("-s, --server <string>", "The address of the server")
.requiredOption("-f, --config <file>", "The ttl file pointing to the configuration of the new repository", "./test/testRepository.ttl")
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
    server: Joi.string().required(),
    config: Joi.string().required().regex(/.*\.ttl$/)
})

const valid = argsSchema.validate(verifiedArgs)

if(valid.error !== undefined){
    throw Error(valid.error.message)
}

/**
 * An interface that holds the arguments the user entered after they have been verified.
 */
interface Args{
    /**The repository that the API will use. */
    repository: string,
    /**Named individual representing the concepts that this database will track */
    content: string,
    /**An ontology that defines the types of knowledge that the database will track */
    ontology: string,
    /**The ip and port of the graphdb server */
    server: string,
    /**The configuration file for the new repository. */
    config: string
}

/**
 * Creates a new repository at the server specified with the configuration file given.
 * @param name The name of the new repository
 * @param configFileName The path to the file containing the configuration of the new repository
 * @param server The ip and port of the graphdb server
 * @async
 */
async function createRepository(name: string, configFileName: string, server: string): Promise<void>{
    await fs.readFile(configFileName,(err, data) => {
        if(err){
            throw Error(`Interrupted after reading ${data.length} bytes by error: ${err.message}`)
        }
        const config = data.toString()
        .replace(/rep:repositoryID ".*"/,`rep:repositoryID "${name}"`)
        .replace(/rdfs:label ".*"/, `rdfs:label "${name}}"`)
        fs.writeFileSync(`./config.ttl`,config)
        let form = new formData()
            const readStream = fs.createReadStream(`./config.ttl`)
            form.append("config",readStream)
            fetch(`${server}/rest/repositories`, {
                method: "POST",
                body: form
            })
    })
}

/**
 * Uploads a block of statements to the repository specified in the server specified.
 * @param block The block of ttl statements being uploaded.
 * @param server The ip and port of the server.
 * @param repository The ID of the repository the statements will be uploaded to
 */
async function uploadBlock(block: string, server: string, repository: string, prefs: Array<[string, string]>): Promise<void>{
    if(/^(?:#[^\n#]*\n*)*$/.exec(block)){
        return
    }
    const location = await startTransaction(server, repository)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        action: "UPDATE",
        body: block,
        location: location
    }
    await ExecTransaction(transaction,prefs).catch((e: Error) => {
        rollback(location)
        throw Error(e.message)
    })

    await commitTransaction(location).catch((e: Error) => {
        rollback(location)
        throw Error(e.message)
    })
}

/**
 * Uploads all of the triples in a ttl file to graphdb.
 * @param file The path to the ttl file.
 * @param server The url to the graphdb server
 * @param repository The ID of the repository that the statements will be uploaded to.
 * @async
 */
async function uploadTriplesFromFile(file: string, server: string, repository: string): Promise<void>{
    const promises = new Array<Promise<void>>()
    let leftOverData: string = ""
    const re = /^(?<body>(?:[^"]|"(?:[^"\\]|\\.)*")*) \.(?:(?!.* \.))/
    let currentData = ""
    let prefixes = new Array<[string, string]>()
    return new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(file)
        stream.on("data", (chunk: string) => {
            currentData += chunk
            prefixes = prefixes.concat(getPrefixes(chunk.toString()))
            while(currentData.length >= 10240){
                let match = currentData.slice(0,10240).match(re)
                if(match && match.groups){
                    leftOverData = currentData.slice(match.groups["body"].length+3)
                    currentData = currentData.slice(0,match.groups["body"].length+3)
                    promises.push(uploadBlock(currentData,server,repository,prefixes))
                    currentData = leftOverData
                    leftOverData = ""
                }else{
                    match = currentData.match(/^(?<body>(?:[^"]|"(?:[^"\\]|\\.)*")*) \./)
                    if(match && match.groups){
                        leftOverData = currentData.slice(match.groups["body"].length+3)
                        currentData = currentData.slice(0,match.groups["body"].length+3)
                        promises.push(uploadBlock(currentData,server,repository,prefixes))
                        currentData = leftOverData
                        leftOverData = ""
                    }else{
                        break
                    }
                }
            }
        })
        stream.on("end", async () => {
            promises.push(uploadBlock(currentData,server,repository,prefixes))
            await Promise.all(promises)
            resolve()
        })
        stream.on("error", (e: Error) => {
            reject(e.message)
        })
        }
    )
}
    
/**
 * Performs first-time setup for the graphdb server.
 * @param args An Args object, created via the command-line arguments supplied to the script.
 */
async function setup(args: Args): Promise<void>{
    await fetch(`${args.server}/rest/repositories`).catch((e: Error) => {
        throw Error(`Could not connect to graphdb! make sure graphdb is running at ${args.server} before testing! exact error: ${e.message}.`)
    })

    await createRepository(args.repository, args.config, args.server)

    await spin(args.server, args.repository, true, args.config)

    const [p1, p2] = [
        uploadTriplesFromFile(args.content, args.server, args.repository),
        uploadTriplesFromFile(args.ontology, args.server, args.repository)
    ]

    await Promise.all([p1, p2])
}

setup(verifiedArgs)

