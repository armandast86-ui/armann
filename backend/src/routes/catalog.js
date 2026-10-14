import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { PRODUCT_SELECT, buildProductFilters, mapProduct, toPositiveInt } from '../lib.js';

export const catalogRouter = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

catalogRouter.get('/categories', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.id, c.slug, c.name, c.image, c.description,
              COUNT(p.id) FILTER (WHERE p.is_active) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order, c.id`,
    );
    res.json(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        image: row.image,
        description: row.description,
        productCount: Number(row.product_count),
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/brands', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT b.id, b.slug, b.name, b.description,
              COUNT(p.id) FILTER (WHERE p.is_active) AS product_count
       FROM brands b
       LEFT JOIN products p ON p.brand_id = b.id
       GROUP BY b.id
       ORDER BY b.name`,
    );
    res.json(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        productCount: Number(row.product_count),
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/settings', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM store_settings WHERE id = 1');
    const row = rows[0];
    if (!row) return res.json(null);
    return res.json({
      storeName: row.store_name,
      tagline: row.tagline,
      announcementText: row.announcement_text,
      announcementEnabled: row.announcement_enabled,
      freeShippingThreshold: Number(row.free_shipping_threshold),
      shippingFee: Number(row.shipping_fee),
      phone: row.phone,
      email: row.email,
      address: row.address,
      socials: Array.isArray(row.socials) ? row.socials : [],
      logoUrl: row.logo_url,
    });
  } catch (error) {
    return next(error);
  }
});

catalogRouter.get('/products', async (req, res, next) => {
  try {
    const { where, values, order } = buildProductFilters(req.query);
    const limit = Math.min(toPositiveInt(req.query.limit) ?? 12, 48);
    const page = toPositiveInt(req.query.page) ?? 1;
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}`,
      values,
    );

    const { rows } = await query(
      `${PRODUCT_SELECT} ${where} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );

    const total = countResult.rows[0]?.total ?? 0;
    res.json({
      items: rows.map(mapProduct),
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/products/:slug', async (req, res, next) => {
  try {
    const { rows } = await query(`${PRODUCT_SELECT} WHERE p.slug = $1`, [req.params.slug]);
    if (!rows[0] || !rows[0].is_active) {
      return res.status(404).json({ error: 'محصول مورد نظر پیدا نشد.' });
    }
    return res.json(mapProduct(rows[0]));
  } catch (error) {
    return next(error);
  }
});

catalogRouter.get('/products/:slug/related', async (req, res, next) => {
  try {
    const { rows: current } = await query('SELECT id, category_id FROM products WHERE slug = $1', [
      req.params.slug,
    ]);
    if (!current[0]) return res.json([]);
    const { rows } = await query(
      `${PRODUCT_SELECT}
       WHERE p.is_active = true AND p.id <> $1 AND p.category_id = $2
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT 4`,
      [current[0].id, current[0].category_id],
    );
    return res.json(rows.map(mapProduct));
  } catch (error) {
    return next(error);
  }
});

catalogRouter.get('/products/:slug/reviews', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS author
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       JOIN users u ON u.id = r.user_id
       WHERE p.slug = $1 AND r.is_approved = true
       ORDER BY r.created_at DESC`,
      [req.params.slug],
    );
    res.json(
      rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        author: row.author,
        createdAt: row.created_at,
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.post('/products/:slug/reviews', requireAuth, async (req, res, next) => {
  try {
    const rating = Number.parseInt(req.body?.rating, 10);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'امتیاز باید عددی بین ۱ تا ۵ باشد.' });
    }
    const comment = (req.body?.comment ?? '').toString().trim().slice(0, 1000) || null;
    const { rows: products } = await query('SELECT id FROM products WHERE slug = $1', [req.params.slug]);
    if (!products[0]) return res.status(404).json({ error: 'محصول مورد نظر پیدا نشد.' });

    const { rows } = await query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
       RETURNING *`,
      [products[0].id, req.user.id, rating, comment],
    );
    return res.status(201).json({ ok: true, review: rows[0] });
  } catch (error) {
    return next(error);
  }
});

catalogRouter.get('/articles', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, slug, title, excerpt, image, reading_minutes, is_demo, created_at
       FROM articles ORDER BY created_at DESC`,
    );
    res.json(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        image: row.image,
        readingMinutes: row.reading_minutes,
        isDemo: row.is_demo,
        createdAt: row.created_at,
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/articles/:slug', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM articles WHERE slug = $1', [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: 'این مقاله پیدا نشد.' });
    const row = rows[0];
    return res.json({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      image: row.image,
      readingMinutes: row.reading_minutes,
      isDemo: row.is_demo,
      createdAt: row.created_at,
    });
  } catch (error) {
    return next(error);
  }
});

catalogRouter.post('/newsletter', async (req, res, next) => {
  try {
    const email = (req.body?.email ?? '').toString().trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ error: 'ایمیل وارد‌شده معتبر نیست.' });
    }
    await query(
      `INSERT INTO newsletter_subscriptions (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [email],
    );
    return res.status(201).json({ ok: true, message: 'عضویت شما در خبرنامه ثبت شد.' });
  } catch (error) {
    return next(error);
  }
});
