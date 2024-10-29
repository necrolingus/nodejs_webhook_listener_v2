import { cacheSet, cacheDelete, cacheAdd, cacheGet } from '../controller/cacheManager.js'
import { generateJsonData } from '../controller/cacheJson.js'

import express from 'express'
const router = express.Router();

//handler function cacheAdd on all the verbs
function handleCacheAdd(req, res) {
    const webhookEndpoint = req.params.webhookid;
    const jsonData = generateJsonData(req);
    const addOutcome = cacheAdd(webhookEndpoint, jsonData);

    if (addOutcome === true) {
        return res.status(200).send();
    } else if (addOutcome === 0) {
        return res.status(404).send("Add this cache key first before adding data to it");
    } else {
        return res.status(503).send();
    }
}

//Create a unique key and set the cache. Respond with this key
router.post("/create-endpoint", async function (req, res) {
    const { myUniqueKey } = req.body;

    if (!myUniqueKey || myUniqueKey.length !== 16 ) {
        return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    cacheSet(myUniqueKey)
    return res.status(200).send(`Your webhook endpoint ID: ${myUniqueKey}`)
});

//delete a cache key
router.delete("/delete-endpoint/:webhookid", async function (req, res) {
    const webhookEndpoint = req.params.webhookid
    const delOutcome = cacheDelete(webhookEndpoint)

    if (delOutcome === 0) {
        return res.status(404).send()
    } else {
        return res.status(200).send(`Webhook endpoint ID deleted`)
    }
});

//add data to cache
router.post("/:webhookid", handleCacheAdd);
router.put("/:webhookid", handleCacheAdd);
router.patch("/:webhookid", handleCacheAdd);
router.delete("/:webhookid", handleCacheAdd);

//get all the data for a key
router.get("/:webhookid", async function (req, res) {
    const webhookEndpoint = req.params.webhookid
    const cacheData = cacheGet(webhookEndpoint)

    //cache key has not been defined yet
    if (cacheData === undefined){
        return res.status(404).send()
    }

    //cache key has been defined but there are no records in cache for it
    if (cacheData.length === 0){
        return res.status(204).send()
    }
    return res.status(200).send(cacheData)
});


export {router}