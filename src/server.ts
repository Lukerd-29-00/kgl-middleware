// We should add some way to verify who the request is coming from; there needs to be some kind of authentication to stop people from messing with each others' accounts!
/**
 *  Middleware software For Knowledge Apps and Leaners Models
 *  Knowledge Graphs For learners 
 *  Casey Rock 
 *  July 30, 2021
 */
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

app.put("/addPerson", processAddPerson)




/**This function should be a separate script run to initialize the server; game devs have no reason to use this function!
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





