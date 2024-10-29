import { localCache } from '../controller/cacheInstance.js'
import { config } from "./config.js";

function cacheSet (webhookEndpoint) {
    localCache.set(webhookEndpoint, [])
}

function cacheDelete (webhookEndpoint) {
    const delOutcome = localCache.del(webhookEndpoint)
    return delOutcome
}

function cacheAdd (webhookEndpoint, jsonData) {
    //First check if key exists before adding data
    const keyExists = localCache.has(webhookEndpoint)
    if (keyExists === false){
        return 0
    }

    const existingData = localCache.get(webhookEndpoint) //returns an arry
    const arrLength = existingData.unshift(jsonData) //adds the new data to the array, and returns the length of the array
    if (arrLength > config.max_items){
        existingData.pop()
    }
    const outcome = localCache.set(webhookEndpoint, existingData)
    return outcome
}

function cacheGet (webhookEndpoint) {
    const existingData = localCache.get(webhookEndpoint);
    return existingData
}

export {cacheSet, cacheDelete, cacheAdd, cacheGet}