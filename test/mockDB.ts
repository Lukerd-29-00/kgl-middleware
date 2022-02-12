import {Express, RequestHandler, Request, Response} from "express"
import {ParamsDictionary, Query} from "express-serve-static-core"
interface MockDB{
    server: Express,
    start: jest.Mock<void, [void]>
    rollback: jest.Mock<void, [void]>
    exec: jest.Mock<void, [string | undefined, string]>
}
interface Qstring extends Query{
    action: string
}
interface Handlers{
	startHandler?: RequestHandler,
	execHandler?: RequestHandler,
	rollbackHandler?: RequestHandler
}
export default function getMockDB(ip: string, server: Express, repo:string, start: boolean, rollback: boolean, exec: boolean, handlers?: Handlers): MockDB{
    const mockTransaction = "ab642438bc4aacdvq"
    const transactions = `/repositories/${repo}/transactions`
    const location = `${transactions}/${mockTransaction}`
    if(!handlers){
        handlers = {}
    }
    handlers = handlers as Handlers
    const output: MockDB = {
        server,
        start: jest.fn<void, [void]>(),
        rollback: jest.fn<void, [void]>(),
        exec: jest.fn<void, [string | undefined, string]>()
    }
    const sendError = (request: Request, response: Response, next: (err?: Error) => void) => {
        next(Error("this simulates an error in graphdb"))
    }
    const defaultHandler = (request: Request, response: Response) => {
        response.send()
    }
    output.server.post(transactions, (request, response, next) => {
        output.start()
        next()
    })
    output.server.delete(location, (request, response, next) => {
        output.rollback()
        next()
    })
    output.server.put(location,(request: Request<ParamsDictionary,string,string,Qstring>, response, next) => {
        output.exec(request.body?.toString(), request.query.action.toString())
        next()
    })
    if(start){
        output.server.post(transactions, handlers.startHandler || ((request, response) => {
            response.header("location",ip[ip.length-1] === "/" ? `${ip}${location.slice(1)}` : `${ip}${location}`)
            response.send()
        }))
    }else{
        output.server.post(transactions, sendError)
    }
    if(rollback){
        output.server.delete(location, handlers.rollbackHandler || defaultHandler)
    }else{
        output.server.delete(location, sendError)
    }
    if(exec){
        output.server.put(location, handlers.execHandler || defaultHandler)
    }else{
        output.server.put(location, sendError)
    }
    return output
}