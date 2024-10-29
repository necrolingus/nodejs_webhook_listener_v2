function generateJsonData(req){
    const allReqHeaders = req.headers
    const allReqCookies = req.cookies
    const allReqParams = req.params
    const allReqQuery = req.query
    const allReqBody = req.body
    const host = allReqHeaders.host
    const requestDate = new Date().toISOString()

    //Build the cache key
    const fullKey = host + "|" + req.method + "|" + requestDate
    
    //Create the JSON object to be cached
    const cacheValue = {}
    cacheValue[fullKey] = {                           
                            "Headers": allReqHeaders, 
                            "Cookies": allReqCookies, 
                            "Params": allReqParams, 
                            "Query": allReqQuery, 
                            "Body": allReqBody        
                        }
    return cacheValue
}

export {generateJsonData}