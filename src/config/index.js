import dotenv from 'dotenv';
dotenv.config();

export const config = Object.freeze({
  port: parseInt(process.env.WL_PORT, 10) || 3000,
  maxItemsPerEndpoint: parseInt(process.env.WL_MAX_ITEMS_PER_ENDPOINT, 10) || 50,
  maxEndpointsPerUser: parseInt(process.env.WL_MAX_ENDPOINTS_PER_USER, 10) || 20,
  cookie: {
    name: process.env.WL_COOKIE_NAME || 'wl_session',
    maxAgeDays: parseInt(process.env.WL_COOKIE_MAX_AGE_DAYS, 10) || 30,
    secret: process.env.WL_COOKIE_SECRET || 'change-me',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
  },
  adminKey: process.env.WL_ADMIN_KEY || '',
});
