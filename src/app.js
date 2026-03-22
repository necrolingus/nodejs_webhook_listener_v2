import express from 'express';
import { engine } from 'express-handlebars';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config/index.js';
import { headers } from './middleware/headers.js';
import { pageRouter, apiRouter, webhookReceiverRouter } from './routes/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.disable('x-powered-by');
if (config.trustProxy > 0) {
  app.set('trust proxy', config.trustProxy);
}

// Handlebars setup
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: join(__dirname, 'views', 'layouts'),
  partialsDir: join(__dirname, 'views', 'partials'),
  helpers: {
    eq: (a, b) => a === b,
    json: (obj) => JSON.stringify(obj, null, 2),
    formatDate: (date) => {
      if (!date) return '';
      return new Date(date).toLocaleString();
    },
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    range: (start, end) => {
      const arr = [];
      for (let i = start; i <= end; i++) arr.push(i);
      return arr;
    },
    truncate: (str, len) => {
      if (!str) return '';
      if (str.length <= len) return str;
      return str.substring(0, len) + '...';
    },
    upper: (str) => str ? str.toUpperCase() : '',
    lower: (str) => str ? str.toLowerCase() : '',
  },
}));
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(headers);
app.use(express.static(join(__dirname, 'public')));

// Routes
app.use('/webhooks', webhookReceiverRouter);
app.use('/api', apiRouter);
app.use('/', pageRouter);

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('pages/error', {
    layout: 'main',
    title: 'Error',
    message: 'Something went wrong',
    user: req.user || null,
    activePage: '',
  });
});

export { app };
