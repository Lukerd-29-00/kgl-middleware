import getApp from "./server"
import {port, ip, defaultRepo, prefixes} from "./config"
import endpoints from "./endpoints/endpoints"

const app = getApp(ip,defaultRepo,prefixes,endpoints,true)

app.listen(port, () => {
    console.log(`App listening on port ${port}.`)
})