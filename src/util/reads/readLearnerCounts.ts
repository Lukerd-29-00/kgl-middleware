import fetch from "node-fetch";
import SparqlQueryGenerator from '../QueryGenerators/SparqlQueryGenerator';
import ExecTransaction from "../transaction/ExecTransaction";
import startTransaction from '../transaction/startTransaction';
import { Transaction } from "../transaction/Transaction";


export interface Result{
    totalCount: number,
    totalCorrect: number
}

/**
 * Handles reading the Users Learner Record from GraphDB
 * If successfull response with a 200 code
 * 
 * @param {string} encodedTriples: The encoded update Query that includes all the information in the ReqBody 
 * @param {Response} response: The HTTP response
 */
export default async function readLearnerCounts(ip: string, repo: string, TotalCountIRI: string, TotalCorrectIRI: string, prefixes: Array<[string, string]>): Promise<Result> {
    let query = `${TotalCountIRI} cco:is_tokenized_by ?TotalCount .${TotalCorrectIRI} cco:is_tokenized_by ?correctCount .`
    const location = await startTransaction(ip, repo)
    query = SparqlQueryGenerator({query, targets: ["?TotalCount", "?correctCount"]}, prefixes,1)
    const transaction: Transaction = {
        subj: null,
        pred: null,
        obj: null,
        action: "QUERY",
        body: query,
        location: location
    }
    const res = await ExecTransaction(transaction,prefixes)
    const match = res.match(/^([0-9]+),([0-9]+)$/m)
    if(match === null){
        return {
            totalCount: 0,
            totalCorrect: 0
        }
    }else{
        return {
            totalCount: parseInt(match[1],10),
            totalCorrect: parseInt(match[2],10)
        }
    }   
}