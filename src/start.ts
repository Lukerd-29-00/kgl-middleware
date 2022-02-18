import getApp from "./server"
import {port, ip, defaultRepo, prefixes, log} from "./config"
import endpoints from "./endpoints/endpoints"

const app = getApp(ip,defaultRepo,prefixes,endpoints,log)

app.listen(port, () => {
    console.log(`App listening on port ${port}.`)
})