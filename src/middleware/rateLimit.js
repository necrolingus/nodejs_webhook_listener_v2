import rateLimit from 'express-rate-limit';

export function createRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    max: maxAttempts,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = Math.ceil(res.getHeader('Retry-After') / 60) || 15;
      res.status(429).render('pages/login', {
        layout: 'main',
        title: 'Login',
        error: `Too many recovery attempts. Please try again in ${retryAfter} minute(s).`,
        recoveryToken: null,
      });
    },
  });
}
