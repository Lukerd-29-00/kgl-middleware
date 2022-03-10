import joi from "joi"

export function toURI(prefixes: [string, string][], obj: string): string{
    for(const prefix of prefixes){
        const re = new RegExp("^"+prefixes[0])
        if(obj.match(re) !== undefined){
            return obj.replace(re,prefix[1])
        }
    }
    throw Error("Unknown prefix!")
}

export function arrayToURI(prefixes: [string, string][], arr: string[]): string[]{
    const output = []
    for(const obj of arr){
        let found = false
        for(const prefix of prefixes){
            const re = new RegExp("^"+prefixes[0])
            if(obj.match(re) !== undefined){
                output.push(obj.replace(re,prefix[1]))
                found = true
                break
            }
        }
        if(!found){
            throw Error(`No known prefix in ${obj}!`)
        }
    }
    return output
}

export function isArray(value: string | string[]): value is string[]{
    return (value as string[]).map !== undefined
}

export default function normalize(value: string | string[], prefixes: [string, string][]): string[]{
    if(isArray(value)){
        const {error} = joi.array().items(joi.string().uri()).required().validate(value)
        if(error === undefined){
            return value
        }else{
            return arrayToURI(prefixes,value)
        }
    }else{
        const {error} = joi.string().uri().required().validate(value)
        if(error === undefined){
            return [value]
        }else{
            return [toURI(prefixes,value)]
        }
    }
}