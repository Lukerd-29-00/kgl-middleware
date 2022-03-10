import getApp from "./server"
import {port, ip, defaultRepo, prefixes, logPath, frontEndIp} from "./config"
import { XSSControl } from "./server"
import endpoints from "./endpoints/endpoints"
import getSubjects from "./endpoints/getSubjects"
import winston from "winston"
import expressWinston from "express-winston"

const policy = new Map<string,XSSControl>()
policy.set(getSubjects.route,{
    allowOrigin: frontEndIp,
    securityPolicy: `default-src ${frontEndIp} script-src 'none'`
})

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({filename: logPath})
]

const logger = {
    main: winston.createLogger({
        transports,
        format: winston.format.json()
    }
    ),
    middleware: expressWinston.logger({
        transports,
        format: winston.format.json(),
        meta: true,
        colorize: false
    })
}

const app = getApp(ip,defaultRepo,prefixes,endpoints,policy,logger)

app.listen(port, () => {
    console.log(`App listening on port ${port}.`)
})