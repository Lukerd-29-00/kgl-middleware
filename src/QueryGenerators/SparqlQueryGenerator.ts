import {prefixes} from "../config"

interface Query {
    query: string
    targets: Array<string> | null
}

function getPrefixes(prefixes: Array<[string, string]>): string{
    let output: string = ""
    for(const prefix of prefixes){
        output += `PREFIX ${prefix[0]}: <${prefix[1]}>\n`
    }
    return output;
}

function getTargets(targets: Array<string>): string{
    let output = ""
    for(const target of targets){
        output += `${target} `
    }
    return output
}

async function SparqlQueryGenerator(query: Query): Promise<string> {   
    let targets: null | string = null
    if(query.targets !== null){
        targets = getTargets(query.targets)
    }
    return ( `${getPrefixes(prefixes)}select ${targets === null ? "* " : targets}where {
        ${query.query}
    }`)
}

export default SparqlQueryGenerator