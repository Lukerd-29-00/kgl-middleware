# Knowledge Graphs For Learners 

### Artifacts
1. `./graphdata` = containes the volumes for the graphdb docker container 
2. `./images` = Stores the prebuild docker images needed to run KGL
3. `./LearnerModelPreUploads` = Preload turtle files into graphdb
4. `./kgl-middleware` = Contains the middle ware software that read and writes to the graphdb. This foulder acks as the volume for the node container 


### What you need to run
1. docker
2. docker-compose
3. node js

### How to start
1. Load the docker images 
`docker load < ./images/graphdb.tar.gz`
`docker load < ./images/kglMiddleware.tar.gz`

2. Run the docker containers with docker-compose
`docker-compose up -d`

3. Load the LearnerModelPreUploads files into graphdb

