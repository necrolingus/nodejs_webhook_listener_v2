import nodeCache from 'node-cache'

const localCache = new nodeCache({"stdTTL":7200, "checkperiod": 600, "deleteOnExpire": true, "maxKeys": 1000})

export {localCache}