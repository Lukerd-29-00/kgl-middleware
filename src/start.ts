import app from "./server"
import {port} from "./globals"

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})