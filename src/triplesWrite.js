let ImportQuery = `
prefix cco: <http://www.ontologyrepository.com/CommonCoreOntologies/>
Insert Data{
    cco:Player_USERID a cco:Person ; TRIPLES .
    
}
`

module.exports = ImportQuery