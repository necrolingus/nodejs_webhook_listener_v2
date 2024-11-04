import { config } from "./controller/config.js";
import express from 'express'
import {router} from './routes/routes.js'
import { headers } from './middleware/headers.js'

const port = config.port

const app = new express()
app.disable('x-powered-by');
app.use(express.json());
app.use(headers);

app.use('/webhooks', router)

app.listen(port, (err) => {
    console.log(`Server is listening on Port ${port}`)
    if (err) {
        console.log(err)
    }
})
