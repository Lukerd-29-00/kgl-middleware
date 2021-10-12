import fetch from 'node-fetch'

async function rollback(location: string): Promise<string>{
    const res = await fetch(location, {method: "DELETE", headers: {"Accept": "text/plain"}})
    if(!res.ok){
        throw Error(`Could not roll back ${location}: ${res.text}`)
    }
    return `Rolled back ${location} successfully!\n`
}

export default rollback