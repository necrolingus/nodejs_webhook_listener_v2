import nodeCache from 'node-cache'
import { config } from "./config.js";

const localCache = new nodeCache({"stdTTL":config.cache_ttl, "checkperiod": config.check_period, "deleteOnExpire": true, "maxKeys": config.max_keys })

export {localCache}