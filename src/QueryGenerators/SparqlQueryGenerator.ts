import {prefixes} from "../globals"

interface Query {
    graphQueries: Array<[string,string]> | null
    query: string | null
    targets: Array<string> | null
}

function getPrefixes(prefixes: Array<[string, string]>): string{
    let output: string = ""
    for(const prefix of prefixes){
        output += `PREFIX ${prefix[0]}: <${prefix[1]}>\n`
    }
    return output;
}

async function processGraph(iri: string, query: string): Promise<string>{
    return `GRAPH <${iri}> {
        ${query}
    }\n`
}

function getTargets(targets: Array<string>): string{
    let output = ""
    for(const target of targets){
        output += `${target} `
    }
    return output
}

async function SparqlQueryGenerator(query: Query): Promise<string> {
    let output = new Array<Promise<string>>();
    if(query.graphQueries !== null){
        for(const graph of query.graphQueries){
            output.push(processGraph(graph[0],graph[1]))
        }    
    }
    let targets: null | string = null
    if(query.targets !== null){
        targets = getTargets(query.targets)
    }
    return Promise.all(output).then((value: Array<string>) => {
        let str = ""
        for(const query of value){
            str += query
        }
        if(query.query !== null){
            str += query.query
        }
        str = `${getPrefixes(prefixes)}select ${targets === null ? "* " : targets}where {
            ${str}    
        }`
        return str
    })
}

export default SparqlQueryGenerator