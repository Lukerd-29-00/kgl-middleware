export interface ResBody{
    correct: number,
    attempts: number,
    mean?: number,
    median?: number,
    stdev?: number
}

interface ParseQueryOptions extends Record<string, boolean | undefined>{
    mean?: boolean,
    median?: boolean,
    stdev?: boolean,
}

interface ParseQueryOptionsWithContent extends ParseQueryOptions{
    content: boolean
}

function parseContent(response: [string, string][], options?: ParseQueryOptions ): ResBody{
    if(options !== undefined){
        const output: ResBody = {
            correct: 0,
            attempts: 0
        }
        let responseTimes
        if(options.stdev || options.mean || options.median){
            responseTimes = new Array<number>()
        }
        for(const match of response){
            if(responseTimes){
                responseTimes.push(parseInt(match[0],10))
            }
            if(match[1] === "true"){
                output.correct++
            }
            output.attempts++
        }
        if(options.mean){
            output.mean = (responseTimes as number[]).reduce((prev: number, current: number) => {
                return current + prev
            })/(responseTimes as number[]).length
        }
        if(options.stdev){
            const mean = (responseTimes as number[]).reduce((prev: number, current: number) => {
                return current + prev
            })/(responseTimes as number[]).length
            const variance = (responseTimes as number[]).reduce((prev: number, current: number) => {
                return prev + (current - mean)
            })/((responseTimes as number[]).length-1)
            output.stdev = Math.sqrt(variance)
        }
        if(options.median && (responseTimes as number[]).length % 2){
            output.median = (responseTimes as number[])[Math.floor((responseTimes as number[]).length/2)]
        }else if(options.median){
            output.median = ((responseTimes as number[])[Math.floor((responseTimes as number[]).length/2)] + (responseTimes as number[])[Math.ceil((responseTimes as number[]).length/2)])/2
        }
        return output
    }else{
        const output: ResBody = {
            correct: 0,
            attempts: 0
        }
        for(const match of response){
            if(match[1] === "true"){
                output.correct++
            }
            output.attempts++
        }
        return output
    }
}

export function parseQueryOutput(response: string, options?: ParseQueryOptions): Map<string, ResBody>

export function parseQueryOutput(response: string, options?: ParseQueryOptionsWithContent): ResBody

export function parseQueryOutput(response: string, options?: ParseQueryOptionsWithContent | ParseQueryOptions): Map<string, ResBody> | ResBody{
    if(options === undefined || !options.content){
        const output = new Map<string,ResBody>()
        const matches = response.matchAll(/^(.+),(.+),(.+)$/gm)
        matches.next()
        let currentContent = ""
        let linesWithCurrentContent = new Array<[string, string]>()
        for(let match = matches.next();!match.done;){
            if(match.value[1] === currentContent){
                linesWithCurrentContent.push([match.value[2], match.value[3]])
                match = matches.next()
            }else{
                if(currentContent !== ""){
                    output.set(currentContent,parseContent(linesWithCurrentContent,options))
                }
                currentContent = match.value[1]
                linesWithCurrentContent = new Array<[string, string]>()
            }
        }
        if(currentContent !== ""){
            output.set(currentContent,parseContent(linesWithCurrentContent,options))
        }
        return output
    }else{
        const lines = new Array<[string, string]>()
        const matches = response.matchAll(/^(.+),(.+)$/gm)
        matches.next()
        for(const match of matches){
            lines.push([match[1],match[2]])
        }
        return parseContent(lines,options)
    }
}
