import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { attachUser } from './auth.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';
import { waitForDatabase } from './db.js';
import { catalogRouter } from './routes/catalog.js';
import { authRouter } from './routes/auth.js';
import { accountRouter } from './routes/account.js';
import { ordersRouter } from './routes/orders.js';
import { adminRouter } from './routes/admin.js';
import { UPLOAD_DIR, uploadRouter } from './routes/uploads.js';

const app = express();
const port = Number(process.env.PORT || 8000);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// The client is served on its own origin during development; credentials are
// allowed so the session cookie travels with the requests.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0) return callback(null, true);
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  }),
);

app.use(attachUser);

app.use('/api', uploadRouter);
app.use('/api/auth', authRouter);
app.use('/api', ordersRouter);
app.use('/api', accountRouter);
app.use('/api/admin', adminRouter);
app.use('/api', catalogRouter);

// Uploaded product images are served from a writable volume, outside the repo.
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'این مسیر پیدا نشد.' });
});

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
app.use((error, _req, res, _next) => {
  console.error('[api] unhandled error:', error?.message);
  res.status(error.status || 500).json({ error: 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.' });
});

await waitForDatabase();
await migrate();
await seed();

app.listen(port, '0.0.0.0', () => {
  console.log(`[api] آیدا بیوتی API is listening on http://0.0.0.0:${port}`);
});
