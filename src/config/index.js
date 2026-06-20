import dotenv from 'dotenv';
dotenv.config();

export const config = Object.freeze({
  port: parseInt(process.env.WL_PORT, 10) || 3000,
  trustProxy: parseInt(process.env.WL_TRUST_PROXY, 10) || 0,
  maxItemsPerEndpoint: parseInt(process.env.WL_MAX_ITEMS_PER_ENDPOINT, 10) || 50,
  maxEndpointsPerUser: parseInt(process.env.WL_MAX_ENDPOINTS_PER_USER, 10) || 20,
  cookie: {
    name: process.env.WL_COOKIE_NAME || 'wl_session',
    maxAgeDays: parseInt(process.env.WL_COOKIE_MAX_AGE_DAYS, 10) || 30,
    secret: process.env.WL_COOKIE_SECRET || 'change-me',
  },
  db: {
    file: process.env.DB_FILE || 'data/webhook_listener.db',
  },
  adminKey: process.env.WL_ADMIN_KEY || '',
});
