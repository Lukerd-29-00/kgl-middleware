import {ip} from "../../../globals"


async function startTransaction(repo: string): Promise<string>{
    const res = await fetch(`${ip}/repositories/${repo}/transactions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json" 
        }
    })
    const location = res.headers["location"]
    return location
}

export default startTransaction