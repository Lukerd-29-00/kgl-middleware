import {Express, RequestHandler, Request} from "express"
import {ParamsDictionary, Query} from "express-serve-static-core"
interface MockDB{
    server: Express,
    start: jest.Mock<void, [void]>
    rollback: jest.Mock<void, [void]>
    exec: jest.Mock<void, [string, string]>
}
interface Qstring extends Query{
    action: string
}
export default function getMockDB(ip: string, server: Express, repo:string, start: boolean, rollback: boolean, exec: boolean, startHandler?: RequestHandler, rollbackHandler?: RequestHandler, execHandler?: RequestHandler): MockDB{
    const mockTransaction = "ab642438bc4aacdvq"
    const transactions = `/repositories/${repo}/transactions`
    const location = `${transactions}/${mockTransaction}`
    const output: MockDB = {
        server: server,
        start: jest.fn<void, [void]>(),
        rollback: jest.fn<void, [void]>(),
        exec: jest.fn<void, [string, string]>()
    }

    if(start){
        output.server.post(transactions, (request, response, next) => {
            output.start()
            if(startHandler === undefined){
                response.header("location",`${ip}${location}`)
                response.send()
            }else{
                startHandler(request,response,next)
            }

        })
    }
    if(rollback){
        output.server.delete(location,(request,response,next)=>{
            output.rollback()
            if(rollbackHandler === undefined){
                response.send()
            }else{
                rollbackHandler(request,response,next)
            }

        })
    }
    if(exec){
        output.server.put(location, (request: Request<ParamsDictionary,string,string,Qstring>,response,next)=>{
            output.exec(request.body.toString(),request.query.action.toString())
            if(execHandler === undefined){
                if(request.query.action !== "COMMIT"){
                    response.send()
                }else{
                    response.status(500)
                    response.send()
                }
            }else{
                execHandler(request,response,next)
            }
            
        })
    }
    return output
}