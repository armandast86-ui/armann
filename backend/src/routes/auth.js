import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import {
  clearSessionCookie,
  publicUser,
  requireAuth,
  setSessionCookie,
  signSession,
} from '../auth.js';

export const authRouter = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(body) {
  const name = (body?.name ?? '').toString().trim();
  const email = (body?.email ?? '').toString().trim().toLowerCase();
  const password = (body?.password ?? '').toString();
  const phone = (body?.phone ?? '').toString().trim() || null;

  if (name.length < 3) return { error: 'نام و نام خانوادگی را کامل وارد کنید.' };
  if (!EMAIL_PATTERN.test(email)) return { error: 'ایمیل وارد‌شده معتبر نیست.' };
  if (password.length < 6) return { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
  return { name, email, password, phone };
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const payload = validateRegistration(req.body);
    if (payload.error) return res.status(400).json({ error: payload.error });

    const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [payload.email]);
    if (existing[0]) {
      return res.status(409).json({ error: 'این ایمیل قبلاً ثبت شده است. وارد شوید.' });
    }

    const hash = await bcrypt.hash(payload.password, 10);
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [payload.name, payload.email, hash, payload.phone],
    );
    setSessionCookie(res, signSession(rows[0]));
    return res.status(201).json({ user: publicUser(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = (req.body?.email ?? '').toString().trim().toLowerCase();
    const password = (req.body?.password ?? '').toString();
    if (!email || !password) {
      return res.status(400).json({ error: 'ایمیل و رمز عبور را وارد کنید.' });
    }
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'ایمیل یا رمز عبور درست نیست.' });
    }
    setSessionCookie(res, signSession(user));
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: publicUser(req.user) });
});

authRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const name = (req.body?.name ?? req.user.name).toString().trim();
    const phone = (req.body?.phone ?? '').toString().trim() || null;
    if (name.length < 3) return res.status(400).json({ error: 'نام و نام خانوادگی را کامل وارد کنید.' });

    let passwordHash = req.user.password_hash;
    const newPassword = (req.body?.password ?? '').toString();
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' });
      }
      passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const { rows } = await query(
      `UPDATE users SET name = $1, phone = $2, password_hash = $3 WHERE id = $4 RETURNING *`,
      [name, phone, passwordHash, req.user.id],
    );
    return res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    return next(error);
  }
});
