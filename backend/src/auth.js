import jwt from 'jsonwebtoken';
import { query } from './db.js';

const COOKIE_NAME = 'aida_session';
const TOKEN_TTL_DAYS = 30;

let warnedAboutSecret = false;

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value && !warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn(
      '[auth] JWT_SECRET is not set — falling back to an insecure development key. ' +
        'Set JWT_SECRET before exposing this store to real customers.',
    );
  }
  return value || 'dev-only-insecure-secret';
}

export function signSession(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret(), {
    expiresIn: `${TOKEN_TTL_DAYS}d`,
  });
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone ?? null,
  };
}

/** Reads the session cookie (if any) and attaches `req.user` — never rejects. */
export async function attachUser(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, secret());
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.id]);
    if (rows[0]) req.user = rows[0];
  } catch {
    // expired or tampered token — treat as an anonymous visitor
  }
  return next();
}

/** Requires a signed-in customer. */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'برای این کار باید وارد حساب خود شوید.' });
  }
  return next();
}

/** Requires an administrator — enforced on the server, not only in the UI. */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'برای این کار باید وارد حساب خود شوید.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'دسترسی به این بخش برای شما مجاز نیست.' });
  }
  return next();
}
