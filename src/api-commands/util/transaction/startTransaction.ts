import {ip} from "../../../globals"
import fetch from "node-fetch"


async function startTransaction(repo: string): Promise<string>{
    const res = await fetch(`${ip}/repositories/${repo}/transactions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json" 
        }
    })
    const location = res.headers.get("location")
    if(location === null){
        throw Error("Could not get location; is graphdb using the wrong version?")
    }
    return location
}

export default startTransaction