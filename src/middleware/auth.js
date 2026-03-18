import { config } from '../config/index.js';
import { findSessionByToken } from '../models/sessionModel.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies[config.cookie.name];
  if (!token) {
    return res.redirect('/login');
  }
  const data = await findSessionByToken(token);
  if (!data) {
    res.clearCookie(config.cookie.name);
    return res.redirect('/login');
  }
  req.user = data.user;
  req.session = data.session;
  next();
}

export async function optionalAuth(req, res, next) {
  const token = req.cookies[config.cookie.name];
  if (token) {
    const data = await findSessionByToken(token);
    if (data) {
      req.user = data.user;
      req.session = data.session;
    }
  }
  next();
}
