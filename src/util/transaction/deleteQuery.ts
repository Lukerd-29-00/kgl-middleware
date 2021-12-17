export function deleteQuery(triples: string, prefixes: Array<[string, string]>): string{
    let query = ""
    for(const prefix of prefixes){
        query += `@prefix ${prefix[0]}: <${prefix[1]}> .\n`
    }
    query += triples
    return query
}