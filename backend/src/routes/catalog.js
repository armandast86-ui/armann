import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import {
  PRODUCT_SELECT,
  buildProductFilters,
  mapProduct,
  toPositiveInt,
} from '../lib.js';

export const catalogRouter = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapBanner(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    image: row.image,
    tone: row.tone,
  };
}

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
      `SELECT b.id, b.slug, b.name, b.logo, b.country, b.description,
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
        logo: row.logo,
        country: row.country,
        description: row.description,
        productCount: Number(row.product_count),
      })),
    );
  } catch (error) {
    next(error);
  }
});

/** Makes with their models — powers the fitment finder and the vehicle filter. */
catalogRouter.get('/vehicles', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT vk.id AS make_id, vk.slug AS make_slug, vk.name AS make_name,
              vm.id AS model_id, vm.slug AS model_slug, vm.name AS model_name,
              vm.year_from, vm.year_to
       FROM vehicle_makes vk
       LEFT JOIN vehicle_models vm ON vm.make_id = vk.id
       WHERE vk.is_active = true
       ORDER BY vk.sort_order, vk.id, vm.sort_order, vm.id`,
    );
    const makes = new Map();
    for (const row of rows) {
      if (!makes.has(row.make_slug)) {
        makes.set(row.make_slug, { id: row.make_id, slug: row.make_slug, name: row.make_name, models: [] });
      }
      if (row.model_id) {
        makes.get(row.make_slug).models.push({
          id: row.model_id,
          slug: row.model_slug,
          name: row.model_name,
          yearFrom: row.year_from,
          yearTo: row.year_to,
        });
      }
    }
    res.json([...makes.values()]);
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/banners', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM promo_banners WHERE is_active = true ORDER BY sort_order, id',
    );
    res.json(rows.map(mapBanner));
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
      announcements: Array.isArray(row.announcements) ? row.announcements : [],
      freeShippingThreshold: Number(row.free_shipping_threshold),
      shippingFee: Number(row.shipping_fee),
      phone: row.phone,
      email: row.email,
      address: row.address,
      socials: Array.isArray(row.socials) ? row.socials : [],
      logoUrl: row.logo_url,
      heroImage: row.hero_image,
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
    const product = mapProduct(rows[0]);

    const { rows: fitments } = await query(
      `SELECT vm.name AS model_name, vm.slug AS model_slug, vm.year_from, vm.year_to,
              vk.name AS make_name, vk.slug AS make_slug
       FROM product_fitments f
       JOIN vehicle_models vm ON vm.id = f.model_id
       JOIN vehicle_makes vk ON vk.id = vm.make_id
       WHERE f.product_id = $1
       ORDER BY vk.sort_order, vm.sort_order`,
      [product.id],
    );

    return res.json({
      ...product,
      compatibility: fitments.map((row) => ({
        make: { name: row.make_name, slug: row.make_slug },
        model: { name: row.model_name, slug: row.model_slug },
        yearFrom: row.year_from,
        yearTo: row.year_to,
      })),
    });
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

catalogRouter.post('/contact', async (req, res, next) => {
  try {
    const name = (req.body?.name ?? '').toString().trim();
    const email = (req.body?.email ?? '').toString().trim().toLowerCase();
    const message = (req.body?.message ?? '').toString().trim();
    const phone = (req.body?.phone ?? '').toString().trim() || null;
    const subject = (req.body?.subject ?? '').toString().trim() || null;

    if (name.length < 3) return res.status(400).json({ error: 'نام خود را کامل وارد کنید.' });
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'ایمیل وارد‌شده معتبر نیست.' });
    if (message.length < 10) return res.status(400).json({ error: 'متن پیام را کامل‌تر بنویسید.' });

    await query(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES ($1,$2,$3,$4,$5)`,
      [name, email, phone, subject, message.slice(0, 2000)],
    );
    return res.status(201).json({ ok: true, message: 'پیام شما ثبت شد؛ کارشناسان ما به‌زودی پاسخ می‌دهند.' });
  } catch (error) {
    return next(error);
  }
});
