import { ip, defaultRepo } from '../../config'
import fetch from "node-fetch";


/**
 * Handles reading the Users Learner Record from GraphDB
 * If successfull response with a 200 code
 * 
 * @param {string} encodedTriples: The encoded update Query that includes all the information in the ReqBody 
 * @param {Response} response: The HTTP response
 */
function readLearnerCounts(TotalCountIRI: string, TotalCorrectIRI: string, callback: (result: { "success": boolean, "totalCorrect": string, "totalCount": string }) => void) {
    let query = `PREFIX cco: <http://www.ontologyrepository.com/CommonCoreOntologies/>
    select (max(?TotalCounts) as ?TotalCount) (max(?CountsCorrect) as ?TotalCorrect)
    where { 
        ${TotalCountIRI} cco:is_tokenized_by ?TotalCounts.
        ${TotalCorrectIRI} cco:is_tokenized_by ?CountsCorrect.

    } `
    let endcodedTriples = encodeURI(query)
    fetch(`${ip}/repositories/${defaultRepo}?query= ` + endcodedTriples, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/rdf+xml',
        },
    }).then(response => response.text())
        .then(data => {
            let newData = data.replace("\r", "")
            let newDataArray = newData.split("\n")
            newDataArray = newData[1].split(",")
            let totalCount = data[0]
            let totalCorrect = data[1]
            if (totalCount != "" && totalCorrect != "") {
                totalCount = totalCount.replace("\r", "")
                totalCorrect = data[1].replace("\r", "")
                callback(
                    {
                        "success": true,
                        "totalCorrect": totalCorrect,
                        "totalCount": totalCount
                    })
            } else {
                callback(
                    {
                        "success": false,
                        "totalCorrect": totalCorrect,
                        "totalCount": totalCount
                    }
                )
            }

        }).catch((error) => {
            console.log(error)
        });
}

export default readLearnerCounts