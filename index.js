import { config } from "./controller/config.js";
import express from 'express'
import {router} from './routes/routes.js'
const port = config.port

const app = new express()
app.use(express.json());

app.use('/webhooks', router)

app.listen(port, (err) => {
    console.log(`Server is listening on Port ${port}`)
    if (err) {
        console.log(err)
    }
})
