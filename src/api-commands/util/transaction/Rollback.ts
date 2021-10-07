import fetch from 'node-fetch'

async function rollback(location: string){
    const res = await fetch(location, {method: "DELETE", headers: {"Accept": "text/plain"}})
    if(!res.ok){
        throw Error(`Could not roll back ${location}: ${res.text}`)
    }
}

export default rollback