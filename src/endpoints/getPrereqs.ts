import { execTransaction, BodyAction, BodyLessAction } from "../util/transaction/execTransaction"
import startTransaction from "../util/transaction/startTransaction"
import rollback from "../util/transaction/rollback"
import readline from "readline"
import {Request, Response} from "express"
import internal, { PassThrough } from "stream"
import { Endpoint } from "../server"
import {Query, ParamsDictionary} from "express-serve-static-core"
import SparqlQueryGenerator from "../util/QueryGenerators/SparqlQueryGenerator"

const route = "/content/:content/prerequisites"

interface ReqParams extends ParamsDictionary{
	content: string
}

class PassThroughLength extends PassThrough{
	bytesWritten: number
	constructor(opts?: internal.TransformOptions){
		super(opts)
		this.bytesWritten = 0
	}
	_write(chunk: string | Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		super._write(chunk, encoding, (error?: Error | null) => {
			this.bytesWritten += chunk.length
			callback(error)
		})
	}
}

async function queryPrerequisites(ip: string, repo: string, prefixes: [string, string][], target: string, writeTo: PassThroughLength): Promise<void>{
	const location = await startTransaction(ip, repo)
	const query = SparqlQueryGenerator({query: `<${target}> cco:has_part ?o`, targets: ["?o"]},prefixes)
	const res = await execTransaction(BodyAction.QUERY,location,prefixes,query)
	execTransaction(BodyLessAction.COMMIT,location).catch(() => {
		rollback(location).catch(() => {})
	})
	const lines = readline.createInterface({input: res.body})
	let firstLine = true
	let secondLine = true
	writeTo.write("{\"prerequisites\": [")
	lines.on("line",line => {
		if(firstLine){
			firstLine = false
			return
		}
		if(!secondLine){
			writeTo.write(",")	
		}else{
			secondLine = false
		}
		writeTo.write(`"${line}"`)
	})
	res.body.once("close",() => {
		writeTo.end("]}")
	})
}

async function processGetPrereqs(request: Request<ReqParams>, response: Response, next: (err?: Error) => void, ip: string, repo: string, prefixes: [string, string][]): Promise<void>{
	response.locals.stream = new PassThroughLength()
	response.locals.stream.once("finish", () => {
		response.locals.length = response.locals.stream.bytesWritten
		next()
	})
	response.locals.stream.once("error", (err: Error) => {
		response.locals.stream.destroy()
		next(err)
	})
	await queryPrerequisites(ip, repo, prefixes, request.params.content, response.locals.stream).catch(e => {
		next(e)
	})
}

const endpoint: Endpoint<ReqParams,string,Record<string,undefined>,Query> = {
	process: processGetPrereqs,
	route,
	method: "get",
	schema: {}
}
export default endpoint