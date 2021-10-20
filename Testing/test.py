import requests
import uuid
import json

ip = "http://localhost:4000"
dbip = "http://localhost:7200"
dbrepo = "api"

class TestFailError(BaseException):
    def __init__(self, test, message):
        super(TestFailError,self).__init__(f"Failed {test.__name__}; {message}")

class HTTPError(BaseException):
    def __init__(self,response):
        super(HTTPError,self).__init__(f"{response.status_code}: {response.text}")

def putEndpoint(endpoint, data):
    headers = {"Content-Type": "application/json"}
    r = requests.put(f"{ip}/{endpoint}",headers=headers,data=json.dumps(data))
    if r.ok:
        return r.text
    else:
        raise HTTPError(r)

def postEndpoint(endpoint, data):
    headers = {"Content-Type": "application/json"}
    r = requests.post(F"{ip}/{endpoint}",headers=headers,data=json.dumps(data))
    if r.ok:
        return r.text
    else:
        raise HTTPError(r)

def deleteEndpoint(endpoint, data):
    headers = {"Content-Type": "application/json"}
    r = requests.delete(f"{ip}/{endpoint}",headers=headers,data=json.dumps(data))
    if r.ok:
        return r.text
    else:
        raise HTTPError(r)

def addPerson(userID, transaction=None):
    data = {"userID": userID}
    if transaction != None:
        data["transactionID"] = transaction
    return putEndpoint("addPerson",data)

def testAddPerson():
    try:
        splittxt = addPerson(uuid.uuid4().hex).split()
    except HTTPError as e:
        raise TestFailError(testAddPerson,"Error interacting with server") from e
    if "".join(map(lambda x: x + " ",splittxt[:-1])).strip() != "Successfully created transaction#":
        raise TestFailError(testAddPerson, f"Unexpected response from server.")
    empty = addPerson(uuid.uuid4().hex,splittxt[-1].strip())
    if empty:
        raise TestFailError(testAddPerson,f"Unexpected response from server: {empty}")
    rollback(splittxt[-1].strip())
    print("Add person test successful!")

def rollback(transaction):
    data = {"transactionID": transaction}
    return deleteEndpoint("rollback", data)

def testRollback():
    rollme = addPerson(uuid.uuid4().hex).split()[-1].strip()
    try:
        output = rollback(rollme)
    except HTTPError as e:
        raise TestFailError(testRollback,"Failed rollback") from e
    if output != f"Rolled back {dbip}/repositories/{dbrepo}/transactions/{rollme} successfully!\n":
        raise TestFailError(testRollback, f"got unexpected output:\n {output}")
    print("Rollback test successful!")

def commit(transaction):
    data = {"transactionID": transaction}
    return postEndpoint("commit", data)



testRollback()
testAddPerson()



    

