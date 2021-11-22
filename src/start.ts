import getApp from "./server"
import {port, ip, defaultRepo, prefixes} from "./config"
import active from "./endpoints/active"
import commit from "./endpoints/commit"
import rollback from "./endpoints/rollback"
import isPresent from "./endpoints/isPresent"
import writeToLearnerRecord from "./endpoints/writeToLearnerRecord"

const app = getApp(ip,defaultRepo,prefixes,[active,commit,rollback,isPresent,writeToLearnerRecord],true)
app.listen(port, () => {
    console.log(`App listening on port ${port}.`)
})