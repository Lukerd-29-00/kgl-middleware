# Knowledge Graphs For Learners REST API
This is the source code for a nodejs-based REST API that can be utilized to query or add data from KGL games to a [graphdb](https://www.ontotext.com/products/graphdb/) database. This API serves as an intermediary that prevents accidental use of terms that are invalid or do not exist in the ontologies this API expects, in order to ensure interoperability between games. 

## API
This API stores statements in rdf triple format in graphdb. The data is uploaded in [Turtle](https://www.w3.org/TR/turtle/) format. Every time a user answers a question, the following data will be stored at users/{their id}/data/{the iri for the concept}:
1. Did they get the question correct or not?
2. if they did get it correct, how long did it take them to respond (in ms)?
3. When was the question answered (in [Unix time](https://en.wikipedia.org/wiki/Unix_time))?
<!-- -->
All request bodies must be in JSON format, and the responses, as long as there is not an error, will also be in JSON format. If there is an error, an error message will be returned in html format.

### Resource structure
The API itself is in a standard REST format. It contains the following resources:
1. /users/{userID}/data/{content}: the questions the user has answered about the content in question. Can be queried through a GET request to view the raw data, or a PUT request to add a statement.
2. /users/{userID}/stats: Some basic statistics about the questions the user has answered about all subjects. Will always at least return how many questions the user has attempted, and how many were correct. Use the mean and stdev query parameters to retrieve the mean and standard deviation of their response times. NOTE: the standard deviation functionality is not yet fully completed: use at your own risk!
3. /users/{userID}/stats/{content}: The same as above, only the statistics are only reported for a specified subject.
4. /active: Checks if the graphdb server is responding.

### Query details

#### Writing data
To write a statement, make a PUT request to /users/{id}/data/{content} with a body containing a boolean value correct and, if correct is true, a response time in milliseconds. The Date header of the request is used to determine the timestamp. (The timestamp may be moved to the body in the future to allow for bulk uploads).

#### Reading data
All queries involving reading data from the database allow the query parameters before and since. These should both be UTC date strings. The data returned will concern only the statements with timestamps after since and before before. Any GET request can also be substituted for a HEAD request.

##### Raw data
To get the raw data, make a request to /users/{id}/data/{content}. Before and since are _required_ for this resource, to make sure people query only the data they actually need and avoid slowdown from overly large requests.

##### Statistics
A request to /users/{id}/stats/{content} will return a json response with the fields "correct" and "attempts". "attempts" represents the number of times the question was attempted, while correct represents the number of these attempts that were successful. Optionally, you may add the mean and stdev query parameters with values of true to get the mean and standard deviation of the response times in the desired time range. If since and before are unspecified, the program will attempt to set before to the Date header. If it is not present, before defaults to the server time (UTC date strings are only accurate to the second anyway, so this is unlikely to make a significant difference in your data, but it is recomended to supply either the before parameter or the Date header, as you cannot be sure when your request will arrive and be processed). Since will be set to a day before the value of before if it is not specified. Alternatively, you can make a request to /users/{id}/stats to get the data for all subjects. The request format is the same, and the response will be the IRI of each content mapped to the output you would get from /users/{id}/stats/{content} for each IRI. Requesting the mean or standard deviation if there are no statements for something will give you null for either statistic. Note that the standard deviation is not calculated using the corrected formula.
<!-- -->
<b>Currently, the standard deviation is not calculated reliably. Use at your own risk!</b>

## Repository Structure

### setup
This directory is not needed to run the current version of the project; it is intended for uploading the relationships between learned concepts; e.g. "learning the letter c is a prerequisite for spelliing the word cat", so that this information can be queried by the games. All games using this API will need to follow the same prerequisite model for this to funciton. View the documentation in the setup.ts file for more details on what the code does.

### src
Contains the source code for the software that actually recieves and executes on API requests.

### test
Contains Jest test suites and some helper modules for testing. In the future, we hope to release a set of tests to ensure that code implements the API we used here correctly, so that other programs can be created that are interoperable with this one.

# Setting up the server
Setting up the server requires you to install nodejs (recommended 16+), npm, and to have graphdb running somewhere. Graphdb does _not_ have to run on the same machine as this middleware. Set the ip in src/config.ts to the url leading to the graphdb instance, the port to the desired port number for the middleware, and defaultRepo to the id of the repository you want to communicate with. Set the prefixes in config.ts to an array of arrays, where each array contains the turtle prefix (including the : character), and the second element is the full IRI it corresponds to. Use npm i to install dependencies, and npm start to start the server. The program will inform you in the console when it is ready to accept connections. The middleware will run if graphdb is not, but the resources will all return errors, for self-explanatory reasons.

# (Presumptuous) FAQ
These are some possible questions I forsee developers having with developing games for this API (mostly because I ran into them myself during testing, or have been grappling with them myself during development):
<!-- -->
Q: Can I access the graphdb database directly?
<!-- -->
A: No.
<!-- -->
Q: My requests to the API keep saying the server is not found when I include the content in the URL, but works fine otherwise. Why?
<!-- -->
A: The content IRIs contain characters that are not URL-safe. make sure to [URL encode](https://en.wikipedia.org/wiki/Percent-encoding) the content IRIs.
<!-- -->
Q: My write requests keep failing, even though the body is perfectly valid JSON, but everything else is fine! what do I do?
<!-- -->
A: Set the Content-Type header to application/json. 
<!-- -->
Q: How do I decide when a student has mastered a particular question?
<!-- -->
A: Since this program is new, there isn't much data on the best method for this. However, I would advise against simply picking an arbitrary number. Let's illustrate why with an example. Suppose I have one question matching 'c' to it's sound, and the other options are q, a, and b There is a 1 in 4 chance the child will guess the right answer at random. If I want them to spell cat with the letters c, a, t, and d, and I only allow them to enter 3 letters, there is a 4^(-3) = 1/64 chance of them guessing it randomly. Setting the same threshold for correct answers for both of these problems is clearly not ideal. I would recommend that you utilize the [χ2 distribution](https://en.wikipedia.org/wiki/Chi-squared_test) to select your thresholds. If the child knows some of the letters, you may need to remember to consider the effects of the [Monty Hall problem](https://en.wikipedia.org/wiki/Monty_Hall_problem), which could skew the percentage of correct answers above what you might expect. It is unknown if young children will realize they can exploit this; it is so unintuitive to adults that they usually do not, but some animals have been known to notice this effect and exploit it, so it wouldn't be too surprising if a young child who hasn't learned anything about probability noticed it. If you're getting complaints that some children are moving on too quickly, this is may be one reason why. If you don't want to deal with this complication, you can sidestep it by not including letters the child already knows as possible answers, but this may result in not having enough letters after the child has answered enough questions, so you will need to find a way to account for that. More implementation recommendations will be added as games come out that address these issues.
<!-- -->
Q: Why are we recording response times?
<!-- -->
A: To detect outliers. This allows detection of another player helping a child with a question, which could otherwise create bad data. Currently, there is no functionality to exclude extreme outliers from queries; you will have to do it yourself by querying the raw data and filtering it yourself. In the future, we plan to implement functions to exclude extreme outliers. However, we do not currently know what distribution the reponse times will fall on, so it is not possible to know the most efficient method for doing this. To find the distribution the response times usually fall into, we need to record this data; hence, we record it without doing much with it, for the time being. If you want to exclude outliers, you can either determine the distribution of the response time yourself in real-time, or use a t-test, which is not distribution-sensitive, as long as you're careful about skew. Don't go too overboard with the calculations, though; the people using these apps may not have perfectly reliable electricity access, so don't go wasting power running massively complex statstical analysis every second or two.



