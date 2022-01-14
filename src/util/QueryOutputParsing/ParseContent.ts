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
    content?: boolean
}

export function mean(numbers: number[]): number{
    return numbers.reduce((prev: number, current: number) => {
        return prev + current
    })/numbers.length
}

export function median(numbers: number[]): number{
    numbers = [...numbers].sort((a,b) => {
        return a - b
    })
    if(numbers.length % 2 === 1){
        return numbers[Math.floor(numbers.length/2)]
    }else{
        return mean([numbers[(numbers.length/2)-1],numbers[numbers.length/2]])
    }
}

export function stdev(numbers: number[]): number{
    const avg = mean(numbers)
    return Math.sqrt(numbers.reduce((prev: number, current: number) => {
        return prev + ((current - avg)**2)
    })/(numbers.length-1))
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
            if(responseTimes && !isNaN(parseInt(match[0],10))){
                responseTimes.push(parseInt(match[0],10))
            }
            if(match[1] === "true"){
                output.correct++
            }
            output.attempts++
        }
        if(options.mean && (responseTimes as number[]).length > 0){
            output.mean = mean(responseTimes as number[])
        }else if(options.mean){
            output.mean = NaN
        }
        if(options.stdev && (responseTimes as number[]).length > 1){
            output.stdev = stdev(responseTimes as number[])
        }else if(options.stdev){
            output.stdev = NaN
        }
        if(options.median && (responseTimes as number[]).length > 0){
            output.median = median(responseTimes as number[])
        }else if(options.median){
            output.median = NaN
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

export function parseQueryOutput(response: string, options?: ParseQueryOptions): Map<string, ResBody> | ResBody{
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
