import SparqlQueryGenerator from "../src/QueryGenerators/SparqlQueryGenerator"
import app from "../src/server"
import supertest from "supertest"

const request = supertest(app)

describe(SparqlQueryGenerator, () => {
    it("Should generate a SPARQL query", async () => {
        const req = request.get("/active")
        req.expect(200)
    })
})