import {Interface} from "readline"
import events from "events"
import { Writable } from "stream"
export interface ResBody{
    correct: number,
    attempts: number,
    mean?: number,
    median?: number,
    stdev?: number
}

interface ParseQueryOptions extends Record<string, boolean | undefined>{
    mean?: boolean,
    stdev?: boolean,
    content?: boolean
}

export function mean(numbers: number[]): number{
    return numbers.reduce((prev: number, current: number) => {
        return prev + current
    })/numbers.length
}

export function stdev(number: number[]): number
export function stdev(numbers: RunningStdev, length: number): number
export function stdev(numbers: number[] | RunningStdev, length?: number): number{
    if(!length){
        numbers = numbers as number[]
        const avg = mean(numbers)
        return Math.sqrt(numbers.reduce((prev: number, current: number) => {
            return prev + ((current - avg)**2)
        })
        //This is numbers.length, not numbers.length - 1, on purpose. This is a parameter, not a statstic; we are querying ALL of the response time values in a particular time frame, NOT a sample of them.
        /numbers.length) 
    }else{
        numbers = numbers as RunningStdev
        return Math.sqrt(length*numbers.s2-numbers.s1**2)/length
    }
    
}

interface ParseLineOutput{
    sum: number
    runningStdev: RunningStdev
}

interface RunningStdev{
    s1: number,
    s2: number
}

function ParseLine(data: string, output: ParseLineOutput, res: ResBody, options: ParseQueryOptions): void{
    const match = data.match(/([^,]+),([^,]+)$/)
    if(match === null){
        throw Error(`Invalid line ${data}`)
    }
    if(match[2] === "true"){
        res.correct++
        if(options.mean){
            output.sum += parseInt(match[1],10)
        }
        if(options.stdev){
            const resTime = parseInt(match[1],10)
            output.runningStdev.s1 += resTime
            output.runningStdev.s2 += resTime**2
        }
    }
    res.attempts++
}

function calculateStats(output: ResBody, stats: ParseLineOutput, options: ParseQueryOptions): void{
    if(options.mean && output.correct > 0){
        output.mean = stats.sum/output.correct
    }else if(options.mean){
        output.mean = NaN
    }
    if(options.stdev && output.correct > 0){
        output.stdev = stdev(stats.runningStdev,output.correct)
    }else if(options.stdev){
        output.stdev = NaN
    }
}

export async function parseQueryOutput(data: Interface, stream: Writable, options: ParseQueryOptions): Promise<void>{
    if(options.content !== undefined){
        const stats: ParseLineOutput = {
            sum: options.mean ? 0 : NaN,
            runningStdev: {
                s1: options.stdev ? 0 : NaN,
                s2: options.stdev ? 0 : NaN
            }
        }
        const output: ResBody = {
            correct: 0,
            attempts: 0
        }
        data.once("line",() => {
            data.on("line", (line: string) => {
                ParseLine(line,stats,output,options)
            })
        })
        await events.once(data,"close")
        calculateStats(output,stats,options)
        const outputString = JSON.stringify(output)
        stream.end(outputString)
    }else{
        const promise = async (data: Buffer | string) => {
            return new Promise<void>(resolve => {
                stream.write(data,() => {
                    resolve()
                })
            })
        }
        const writes = new Array<Promise<void>>()
        const write = (data: string | Buffer) => {
            writes.push(promise(data))
        }

        let currentContent = ""
        let firstLine = true
        let firstObject = true
        let stats: ParseLineOutput = {
            sum: options.mean ? 0 : NaN,
            runningStdev: {
                s1: options.stdev ? 0 : NaN,
                s2: options.stdev ? 0 : NaN
            }
        }
        let currentOutput: ResBody = {
            attempts: 0,
            correct: 0
        }
        stream.write("{")
        data.on("line",(data: Buffer) => {
            if(firstLine){
                firstLine = false
                return
            }
            const line = data.toString()
            const match = line.match(/^(.+),(.+),(.+)$/)
            if(match === null){
                throw Error("invalid response from graphdb")
            }
            if(match[1] !== currentContent){
                if(currentContent !== "" && !firstObject){
                    calculateStats(currentOutput,stats,options)
                    const newString = `,\n"${currentContent}": ${JSON.stringify(currentOutput)}`
                    write(newString)
                }else if(currentContent !== ""){
                    firstObject = false
                    calculateStats(currentOutput,stats,options)
                    const newString = `"${currentContent}": ${JSON.stringify(currentOutput)}`
                    write(newString)
                }
                currentContent = match[1]
                stats = {
                    sum: options.stdev ? 0 : NaN,
                    runningStdev: {
                        s1: options.stdev ? 0 : NaN,
                        s2: options.stdev ? 0 : NaN
                    }
                }
                currentOutput = {
                    correct: 0,
                    attempts: 0
                }
            }
            ParseLine(line,stats,currentOutput,options)
        })
        await events.once(data,"close")
        if(currentContent !== "" && !firstObject){
            calculateStats(currentOutput,stats,options)
            const newString = `,"${currentContent}": ${JSON.stringify(currentOutput)}`
            write(newString)
        }else if(currentContent !== ""){
            calculateStats(currentOutput,stats,options)
            const newString = `"${currentContent}": ${JSON.stringify(currentOutput)}`
            write(newString)
        }
        write("}")
        await Promise.all(writes) //Make sure all the data is finished writing before ending the writable stream!
        stream.end()
    }
}
