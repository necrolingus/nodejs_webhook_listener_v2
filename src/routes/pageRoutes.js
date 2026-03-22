import { Router } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import * as userModel from '../models/userModel.js';
import * as sessionModel from '../models/sessionModel.js';
import * as endpointModel from '../models/endpointModel.js';
import * as webhookModel from '../models/webhookModel.js';

// 5 recovery attempts per IP per 15 minutes
const recoveryLimiter = createRateLimiter(5, 15 * 60 * 1000);

const router = Router();

function setSessionCookie(res, token) {
  res.cookie(config.cookie.name, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: config.cookie.maxAgeDays * 24 * 60 * 60 * 1000,
  });
}

async function createSessionForUser(userId) {
  const sessionToken = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + config.cookie.maxAgeDays * 24 * 60 * 60 * 1000);
  await sessionModel.createSession(userId, sessionToken, expiresAt);
  return sessionToken;
}

// Landing page
router.get('/', optionalAuth, (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.render('pages/login', { layout: 'main', title: 'Webhook Listener', error: null, recoveryToken: null });
});

// Login page
router.get('/login', optionalAuth, (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.render('pages/login', { layout: 'main', title: 'Login', error: null, recoveryToken: null });
});

// Login with Cookie (create new user or recover)
router.post('/login', async (req, res, next) => {
  const { action, recovery_token } = req.body;

  if (action === 'create') {
    const recoveryToken = crypto.randomBytes(6).toString('hex');
    const user = await userModel.createUser(recoveryToken);
    const sessionToken = await createSessionForUser(user.id);
    setSessionCookie(res, sessionToken);
    return res.render('pages/login', { layout: 'main', title: 'Account Created', error: null, recoveryToken });
  }

  if (action === 'recover') {
    // Run rate limiter for recovery attempts only
    return recoveryLimiter(req, res, async () => {
      if (!recovery_token || !recovery_token.trim()) {
        return res.render('pages/login', { layout: 'main', title: 'Login', error: 'Please enter a recovery token', recoveryToken: null });
      }
      const user = await userModel.findUserByRecoveryToken(recovery_token.trim());
      if (!user) {
        return res.render('pages/login', { layout: 'main', title: 'Login', error: 'Invalid recovery token', recoveryToken: null });
      }
      const sessionToken = await createSessionForUser(user.id);
      setSessionCookie(res, sessionToken);
      return res.redirect('/dashboard');
    });
  }

  res.redirect('/login');
});

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  const endpoints = await endpointModel.findEndpointsByUserId(req.user.id);
  res.render('pages/dashboard', {
    layout: 'main',
    title: 'Dashboard',
    user: req.user,
    endpoints,
    maxEndpoints: config.maxEndpointsPerUser,
    activePage: 'dashboard',
  });
});

// Endpoint detail
router.get('/endpoints/:key', requireAuth, async (req, res) => {
  const endpoint = await endpointModel.findEndpointByKey(req.params.key);
  if (!endpoint || endpoint.user_id !== req.user.id) {
    return res.status(404).render('pages/error', { layout: 'main', title: 'Not Found', message: 'Endpoint not found', user: req.user, activePage: '' });
  }
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const [webhooks, total] = await Promise.all([
    webhookModel.findWebhooksByEndpointId(endpoint.id, limit, offset),
    webhookModel.countWebhooksByEndpointId(endpoint.id),
  ]);
  const baseUrl = `${req.protocol}://${req.get('host')}/webhooks/${endpoint.endpoint_key}`;
  res.render('pages/endpoint-detail', {
    layout: 'main',
    title: `Endpoint: ${endpoint.label || endpoint.endpoint_key}`,
    user: req.user,
    endpoint,
    webhooks,
    total,
    page,
    pages: Math.ceil(total / limit),
    webhookUrl: baseUrl,
    activePage: 'dashboard',
  });
});

// Settings
router.get('/settings', requireAuth, (req, res) => {
  res.render('pages/settings', {
    layout: 'main',
    title: 'Settings',
    user: req.user,
    activePage: 'settings',
    success: req.query.success || null,
  });
});

// Update display name
router.post('/settings', requireAuth, async (req, res) => {
  const { display_name } = req.body;
  await userModel.updateDisplayName(req.user.id, display_name || null);
  res.redirect('/settings?success=1');
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  await sessionModel.deleteSession(req.session.session_token);
  res.clearCookie(config.cookie.name);
  res.redirect('/login');
});

export { router as pageRouter };
