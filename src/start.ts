import getApp from "./server"
import {port, ip, defaultRepo, prefixes, logPath} from "./config"
import endpoints from "./endpoints/endpoints"
import winston from "winston"
import expressWinston from "express-winston"

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

const app = getApp(ip,defaultRepo,prefixes,endpoints,logger)

app.listen(port, () => {
    console.log(`App listening on port ${port}.`)
})