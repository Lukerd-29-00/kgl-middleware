import { ip } from "../../../globals"

export function insertQuery(graph: string, triples: string, prefixes: Map<string,string>): string{
    let query: string = ""
    const entries = prefixes.entries()
    for(let entry = entries.next(); !entry.done;entry = entries.next()){
        query += `PREFIX ${entry.value[0]}: <${entry.value[1]}>\n`
    }
    query += `INSERT DATA {GRAPH <${graph}> { ${triples} } }`
    return query
}