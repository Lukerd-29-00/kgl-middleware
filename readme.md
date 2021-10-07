# Knowledge Graphs For Learners 

### Artifacts

1. `./LearnerModelPreUploads` = Preload turtle files into graphdb
2. `./src` = Contains the middle ware software that read and writes to the graphdb. This foulder acks as the volume for the node container
3. `./StandardContentParser` I don't know what this is, but it looked important so I included it in this new repo. I can filter it out later if needed.


### What you need to run
1. node js
2. grpaphdb

### How to start
1. Start graphdb (exact details may depend on version and OS)

2. Start the middleware server
`cd src && npm start && cd -`
The first time you run it, you will need to install dependencies first:
`cd src && npm i && cd -`

3. Load the LearnerModelPreUploads files into graphdb

