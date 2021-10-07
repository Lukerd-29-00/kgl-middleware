/**
 *  Middleware software For Knowledge Apps and Leaners Models
 *  Knowledge Graphs For learners 
 *  Casey Rock 
 *  July 30, 2021
 */
import {ip, defaultRepo} from "./globals"
import addPerson from "./api-commands/write/addPerson";
import processAddPerson from "./request-processing/processAddPerson";
const express = require("express")
const fetch = require('node-fetch');
const bodyParser = require("body-parser");
const fs = require('fs')
const packets = require('./ftmDataPacket')
const ImportQuery = require('./triplesWrite')
const app = express()
const port = 4000

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

/**
 * Read from the learner models. Pass as parameters in the url path
 * @param query: the game of the sparql query you want to run
 * @param userID: the user id for the person 
 
app.get('/read/:query/:userID', function (request, response){
    try{
        let query = request.params.query
        let userId = request.params.userID;
        let userIRI = `cco:Player_${userId}`
        const queryPath = `./Queries/query_${query}.rq`

        console.log(queryPath)
        console.log(userIRI)

        fs.readFile(queryPath, "utf8", function(err, data){
            if(data != undefined){
                data = data.replace(/PLACEHOLDER/g, userIRI)
                let encodedQuery = encodeURIComponent(data)
                // Max Chars 2048
                fetch(`${ip}/repositories/LearnerModels?query=${encodedQuery}` , {
                    method: 'GET', 
                    headers: {
                        'Content-Type': 'application/rdf+xml',
                    },
                }).then(res => res.text())
                    .then(data => {
                        queryResults = data.replace(/\r/g,'')

                        let resultArray = queryResults.split('\n')
                        resultArray.shift()
                        console.log(resultArray)
                        response.send(resultArray)
                    }).catch((error) => {
                        console.error('Error:', error);
                });  
            }else{
                response.send("Can't find query")
            }
        })
        
    }catch(error){
        console.log(error)
    }
})
*/
app.put("/addPerson", processAddPerson)

/**
 * WRITE to Learner Model for a player. 
 * @param userID: the user id for the person 
 * @param triples: CCO triples that a person has learned
 
app.put('/write/:userID', function (request, response){
    try{
        let userId = request.params.userID;
        let triples = request.body.triples;
        let updateTriples = ImportQuery.replace(/USERID/, userId)
        updateTriples = updateTriples.replace(/TRIPLES/,triples)
        let encodedTriples = encodeURIComponent(updateTriples)
        console.log(updateTriples)
        fetch(`${ip}/repositories/LearnerModels/statements?update='${encodedTriples}`  , {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/rdf+xml',
            },
        }).then(response => response.text())
            .then(data => {
                console.log('Success:', data);
            }).catch((error) => {
                console.error('Error:', error);
        });
        response.send("Updated Learner Model")
    }catch(error){
        console.log(error)
    }
})



/**
 * WRITE the FTM Graduate Learner Model for a first time player. 
 * @param userID: the user id for the person 
 
app.post('/WriteFtmGraduateLM/:userID', function (request, response){
    try{
            let userId = request.params.userID;
            let userIRI = `cco:Player_${userId}`
            
            for(packet of packets){
                let realPacket = packet.replace(/PLACEHOLDER/g, userIRI)
                let encodedQuery = encodeURIComponent(realPacket)
                fetch(`${ip}/repositories/LearnerModels/statements?update=${encodedQuery}` , {
                    method: 'POST', 
                    headers: {
                        'Content-Type': 'application/rdf+xml',
                    },
                }).then(response => response.text())
                    .then(data => {
                        console.log('Success:', data);
                    }).catch((error) => {
                        console.error('Error:', error);
                });
            }
        response.send("Uploaded Learner Model")
    }catch(error){
        console.log(error)
    }
})
*/

app.listen(port, () =>{
    console.log(`Middleware software listening on port ${port}`)
})





