export function insertQuery(triples: string, prefixes: Array<[string, string]>): string{
    let query = ""
    for(const prefix of prefixes){
        query += `PREFIX ${prefix[0]}: <${prefix[1]}>\n`
    }
    query += `INSERT DATA {\n ${triples} \n}`
    return query
}