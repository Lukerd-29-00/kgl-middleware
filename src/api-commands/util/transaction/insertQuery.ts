export function insertQuery(triples: string, prefixes: Map<string,string>): string{
    let query: string = ""
    const entries = prefixes.entries()
    for(let entry = entries.next(); !entry.done;entry = entries.next()){
        query += `PREFIX ${entry.value[0]}: <${entry.value[1]}>\n`
    }
    query += `INSERT DATA { ${triples} }`
    return query
}