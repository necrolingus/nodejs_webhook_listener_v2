export const config = {
    check_period: process.env.WL_CACHE_CHECK_PERIOD || 600,
    cache_ttl: process.env.WL_CACHE_TTL || 7200,
    max_items: process.env.WL_CACHE_MAX_ITEMS || 50,
    max_keys: process.env.WL_CACHE_MAX_KEYS || 100,
    adminKey: process.env.WL_ADMIN_KEY,
    port: process.env.WL_PORT || 3000
};
