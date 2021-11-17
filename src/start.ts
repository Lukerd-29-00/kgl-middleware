import getApp from "./server"
import {port, ip, defaultRepo, prefixes} from "./config"

const app = getApp(ip,defaultRepo,prefixes,true)
app.listen(port, () => {
    console.log(`App listening on port ${port}.`)
})