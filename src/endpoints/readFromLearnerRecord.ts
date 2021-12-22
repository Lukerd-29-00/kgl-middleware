import { Request, Response } from "express"
import Joi from "joi"
import { Endpoint } from "../server"
import { ip, defaultRepo } from "../config"
import fetch from "node-fetch"


const schema = Joi.object({
    userID: Joi.string().required(),
})

function processReadFromLearnerRecord(request: Request, response: Response) {
    const userID = request.body.userID
    console.log(request.body)
    const query = `PREFIX cco: <http://www.ontologyrepository.com/CommonCoreOntologies/>
    select ?StandardContent where { 

        cco:Person_${userID} rdf:type cco:Person ;
               cco:agent_in ?ActOfLearning . 

        ?ActOfLearning cco:has_object ?StandardContent . 
        } `
    const endcodedTriples = encodeURI(query)
    fetch(`${ip}/repositories/${defaultRepo}?query= ` + endcodedTriples, {
        method: "GET",
        headers: {
            "Content-Type": "application/rdf+xml",
            "Accept": "application/sparql-results+json"
        },
    }).then(response => response.text())
        .then(data => {
            let dataObj = JSON.parse(data)
            response.status(200).send({ "data": dataObj.results.bindings })
        }).catch((error) => {
            response.status(404).send(error)
            console.log(error)
        })
}

const route = "/readFromLearnerRecord"

const endpoint: Endpoint = { method: "post", schema: schema, route: route, process: processReadFromLearnerRecord }
export default endpoint