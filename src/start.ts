import getApp from "./server"
import {port, ip, defaultRepo, prefixes} from "./config"

getApp(ip,defaultRepo,prefixes).listen(port, () => {
    console.log(`App listening on port ${port}.`)
})