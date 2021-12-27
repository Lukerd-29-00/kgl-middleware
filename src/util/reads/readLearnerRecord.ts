import SparqlQueryGenerator from "../QueryGenerators/SparqlQueryGenerator"
import ExecTransaction from "../transaction/ExecTransaction"
import startTransaction from "../transaction/startTransaction"
import { Transaction } from "../transaction/Transaction"
import { Result } from "./readLearnerCounts"


export interface LearnerRecord {
    response: { [x: string]: { person: string; standardContent: string; totalCounts: string; countsCorrect: string; }; }
}

/**
 * Handles reading the Users Learner Record from GraphDB
 * If successfull response with a 200 code
 * 
 * @param {string} encodedTriples: The encoded update Query that includes all the information in the ReqBody 
 * @param {Response} response: The HTTP response
 */
export default async function readLearnerRecord(ip: string, repo: string, userID: string, prefixes: Array<[string, string]>): Promise<LearnerRecord> {
    let query = `PREFIX cco: <http://www.ontologyrepository.com/CommonCoreOntologies/>
    select ?Person ?standardContent (max(?TotalCounts) as ?TotalCounts) (max(?CorrectCounts) as ?CorrectCounts) 
    where { 
        BIND(cco:Person_${userID} as ?Person)
        ?Person a cco:Person;
            cco:agent_in ?actOfLearning . 
            
        ?actOfLearning a cco:ActOfEducationalTrainingAcquisition ; 
        cco:has_object ?standardContent . 
        
        BIND( STR(?standardContent) AS ?string ).
    
        # Get Strings of the Content 
        BIND( STR(?standardContent) AS ?StandardContentIriString ).
        BIND( REPLACE( ?StandardContentIriString,"http://www.ontologyrepository.com/CommonCoreOntologies/","" ) AS ?StringStandContent ).
                
        # Get Person Guid
        BIND( STR(?Person) AS ?PersonIriString ).
        BIND( REPLACE( ?PersonIriString,"http://www.ontologyrepository.com/CommonCoreOntologies/Person_","" ) AS ?PersonGuidString ).
        
        # Counts Correct
        BIND( CONCAT("http://www.ontologyrepository.com/CommonCoreOntologies/Act_Learning_",?StringStandContent, "_CountCorrect_Measurment_Person_",?PersonGuidString ) as ?CorrectCountString)
        Bind(IRI(?CorrectCountString) as ?CorrectCountIRI)
    
        # Total Count
        BIND( CONCAT("http://www.ontologyrepository.com/CommonCoreOntologies/Act_Learning_",?StringStandContent, "_TotalCount_Measurment_Person_",?PersonGuidString ) as ?TotalCountString)
        Bind(IRI(?TotalCountString) as ?TotalCountIRI)
        
        ?CorrectCountIRI cco:is_tokenized_by ?CorrectCounts . 
        ?TotalCountIRI cco:is_tokenized_by ?TotalCounts . 
        
    
    } 
    GROUP BY ?Person ?standardContent`
    const location = await startTransaction(ip, repo)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        action: "QUERY",
        body: query,
        location: location
    }
    const res = await ExecTransaction(transaction, prefixes)
    let data = res.split("\r\n")
    data.shift()
    data.pop()

    let queryResult = {}
    for (let node of data) {
        let parseNode = node.split(',')
        let content = parseNode[1]
        let obj = {
            [content]: {
                person: parseNode[0],
                standardContent: parseNode[1],
                totalCounts: parseNode[2],
                countsCorrect: parseNode[3]
            }
        }
        Object.assign(queryResult, obj)
    }

    return { response: queryResult }
}

