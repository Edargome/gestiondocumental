const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attemptsByKey = new Map();

const buildKey = (req) => `${req.ip}:${(req.body?.nickname || '').toLowerCase()}`;

const loginRateLimit = (req, res, next) => {
  const key = buildKey(req);
  const now = Date.now();
  const entry = attemptsByKey.get(key);

  if (entry && now - entry.firstAttemptAt < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.firstAttemptAt);
    return res.status(429).send({
      error: 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.',
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    });
  }

  next();
};

const registerFailedAttempt = (req) => {
  const key = buildKey(req);
  const now = Date.now();
  const entry = attemptsByKey.get(key);

  if (!entry || now - entry.firstAttemptAt >= WINDOW_MS) {
    attemptsByKey.set(key, { count: 1, firstAttemptAt: now });
  } else {
    entry.count += 1;
  }
};

const clearAttempts = (req) => {
  attemptsByKey.delete(buildKey(req));
};

module.exports = { loginRateLimit, registerFailedAttempt, clearAttempts };
