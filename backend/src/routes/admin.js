import { Router } from 'express';
import { query } from '../db.js';
import { requireAdmin } from '../auth.js';
import { PRODUCT_SELECT, buildProductFilters, mapProduct, toPositiveInt } from '../lib.js';
import { mapOrderItem, mapOrderSummary } from './account.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

/* ---------------------------------- overview ---------------------------------- */

adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const [products, stock, orders, customers, newsletter, recent, lowStock] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE is_active)::int AS active,
                    COUNT(*) FILTER (WHERE is_demo)::int AS demo
             FROM products`),
      query(`SELECT COUNT(*) FILTER (WHERE stock <= 0)::int AS out_of_stock,
                    COUNT(*) FILTER (WHERE stock > 0 AND stock <= 5)::int AS low_stock
             FROM products WHERE is_active = true`),
      query(`SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
                    COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
                    COUNT(*) FILTER (WHERE status = 'shipped')::int AS shipped,
                    COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
                    COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
                    COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::bigint AS paid_revenue,
                    COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0)::bigint AS order_value
             FROM orders`),
      query(`SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE role = 'customer')::int AS customers
             FROM users`),
      query('SELECT COUNT(*)::int AS total FROM newsletter_subscriptions'),
      query(`SELECT o.*, COUNT(oi.id)::int AS item_count
             FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
             GROUP BY o.id ORDER BY o.created_at DESC LIMIT 5`),
      query(`SELECT id, name, slug, stock FROM products
             WHERE is_active = true AND stock <= 5 ORDER BY stock ASC LIMIT 6`),
    ]);

    res.json({
      products: products.rows[0],
      stock: stock.rows[0],
      orders: {
        ...orders.rows[0],
        paidRevenue: Number(orders.rows[0].paid_revenue),
        orderValue: Number(orders.rows[0].order_value),
      },
      users: customers.rows[0],
      newsletter: newsletter.rows[0].total,
      recentOrders: recent.rows.map(mapOrderSummary),
      lowStock: lowStock.rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, stock: row.stock })),
    });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------- products ---------------------------------- */

function readProduct(body) {
  const name = (body?.name ?? '').toString().trim();
  const price = Number.parseInt(body?.price, 10);
  const compareAtPrice = body?.compareAtPrice === '' || body?.compareAtPrice === null || body?.compareAtPrice === undefined
    ? null
    : Number.parseInt(body.compareAtPrice, 10);
  const stock = Number.parseInt(body?.stock ?? 0, 10);
  const categoryId = Number.parseInt(body?.categoryId, 10);
  const brandId = Number.parseInt(body?.brandId, 10);

  if (name.length < 3) return { error: 'نام محصول را کامل وارد کنید.' };
  if (!Number.isFinite(price) || price < 0) return { error: 'قیمت را به تومان و به‌صورت عدد وارد کنید.' };
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)) {
    return { error: 'قیمت قبل از تخفیف باید بزرگ‌تر از قیمت فروش باشد.' };
  }
  if (!Number.isFinite(stock) || stock < 0) return { error: 'موجودی نمی‌تواند منفی باشد.' };
  if (!Number.isFinite(categoryId)) return { error: 'دسته‌بندی محصول را انتخاب کنید.' };

  const gallery = Array.isArray(body?.gallery)
    ? body.gallery.filter((item) => typeof item === 'string' && item.trim()).slice(0, 6)
    : [];
  const specs = Array.isArray(body?.specs)
    ? body.specs
        .filter((item) => item && `${item.label ?? ''}`.trim() && `${item.value ?? ''}`.trim())
        .map((item) => ({ label: `${item.label}`.trim(), value: `${item.value}`.trim() }))
        .slice(0, 12)
    : [];

  return {
    value: {
      name,
      slug: (body?.slug ?? '').toString().trim() || `p-${Date.now().toString(36)}`,
      brandId: Number.isFinite(brandId) ? brandId : null,
      categoryId,
      shortDescription: (body?.shortDescription ?? '').toString().trim() || null,
      description: (body?.description ?? '').toString().trim() || null,
      price,
      compareAtPrice,
      stock,
      image: (body?.image ?? '').toString().trim() || null,
      gallery,
      specs,
      ingredients: (body?.ingredients ?? '').toString().trim() || null,
      usage: (body?.usage ?? '').toString().trim() || null,
      isFeatured: Boolean(body?.isFeatured),
      isNew: Boolean(body?.isNew),
      isActive: body?.isActive === undefined ? true : Boolean(body.isActive),
    },
  };
}

adminRouter.get('/products', async (req, res, next) => {
  try {
    const { where, values, order } = buildProductFilters(req.query, { includeInactive: true });
    const limit = Math.min(toPositiveInt(req.query.limit) ?? 20, 100);
    const page = toPositiveInt(req.query.page) ?? 1;
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id ${where}`,
      values,
    );
    const { rows } = await query(
      `${PRODUCT_SELECT} ${where} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    const total = countResult.rows[0].total;
    res.json({ items: rows.map(mapProduct), total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/products/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'محصول پیدا نشد.' });
    return res.json(mapProduct(rows[0]));
  } catch (error) {
    return next(error);
  }
});

adminRouter.post('/products', async (req, res, next) => {
  try {
    const payload = readProduct(req.body);
    if (payload.error) return res.status(400).json({ error: payload.error });
    const p = payload.value;

    const { rows: duplicate } = await query('SELECT id FROM products WHERE slug = $1', [p.slug]);
    if (duplicate[0]) return res.status(409).json({ error: 'این نامک (slug) قبلاً استفاده شده است.' });

    const { rows } = await query(
      `INSERT INTO products
         (slug, name, brand_id, category_id, short_description, description, price, compare_at_price,
          stock, image, gallery, specs, ingredients, usage, is_featured, is_new, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15,$16,$17)
       RETURNING id`,
      [p.slug, p.name, p.brandId, p.categoryId, p.shortDescription, p.description, p.price, p.compareAtPrice,
       p.stock, p.image, JSON.stringify(p.gallery), JSON.stringify(p.specs), p.ingredients, p.usage,
       p.isFeatured, p.isNew, p.isActive],
    );
    const { rows: created } = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [rows[0].id]);
    return res.status(201).json(mapProduct(created[0]));
  } catch (error) {
    return next(error);
  }
});

adminRouter.put('/products/:id', async (req, res, next) => {
  try {
    const payload = readProduct(req.body);
    if (payload.error) return res.status(400).json({ error: payload.error });
    const p = payload.value;

    const { rows: duplicate } = await query('SELECT id FROM products WHERE slug = $1 AND id <> $2', [
      p.slug,
      req.params.id,
    ]);
    if (duplicate[0]) return res.status(409).json({ error: 'این نامک (slug) قبلاً استفاده شده است.' });

    const { rowCount } = await query(
      `UPDATE products SET slug=$1, name=$2, brand_id=$3, category_id=$4, short_description=$5,
         description=$6, price=$7, compare_at_price=$8, stock=$9, image=$10, gallery=$11::jsonb,
         specs=$12::jsonb, ingredients=$13, usage=$14, is_featured=$15, is_new=$16, is_active=$17,
         updated_at = now()
       WHERE id = $18`,
      [p.slug, p.name, p.brandId, p.categoryId, p.shortDescription, p.description, p.price, p.compareAtPrice,
       p.stock, p.image, JSON.stringify(p.gallery), JSON.stringify(p.specs), p.ingredients, p.usage,
       p.isFeatured, p.isNew, p.isActive, req.params.id],
    );
    if (!rowCount) return res.status(404).json({ error: 'محصول پیدا نشد.' });
    const { rows } = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [req.params.id]);
    return res.json(mapProduct(rows[0]));
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete('/products/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'محصول پیدا نشد.' });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

/* ----------------------------------- orders ----------------------------------- */

adminRouter.get('/orders', async (req, res, next) => {
  try {
    const clauses = [];
    const values = [];
    if (req.query.status) {
      values.push(req.query.status);
      clauses.push(`o.status = $${values.length}`);
    }
    if (req.query.query) {
      values.push(`%${String(req.query.query).trim()}%`);
      clauses.push(`(o.order_number ILIKE $${values.length} OR o.customer_name ILIKE $${values.length} OR o.phone ILIKE $${values.length})`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT o.*, COUNT(oi.id)::int AS item_count
       FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where} GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`,
      values,
    );
    res.json(rows.map(mapOrderSummary));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/orders/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'سفارش پیدا نشد.' });
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [rows[0].id]);
    return res.json({ ...mapOrderSummary(rows[0]), items: items.map(mapOrderItem) });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch('/orders/:id', async (req, res, next) => {
  try {
    const status = req.body?.status;
    const paymentStatus = req.body?.paymentStatus;
    if (status && !ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'وضعیت سفارش نامعتبر است.' });
    if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ error: 'وضعیت پرداخت نامعتبر است.' });
    }
    const { rows } = await query(
      `UPDATE orders
       SET status = COALESCE($1, status), payment_status = COALESCE($2, payment_status)
       WHERE id = $3 RETURNING *`,
      [status ?? null, paymentStatus ?? null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'سفارش پیدا نشد.' });
    return res.json(mapOrderSummary(rows[0]));
  } catch (error) {
    return next(error);
  }
});

/* --------------------------------- categories --------------------------------- */

adminRouter.post('/categories', async (req, res, next) => {
  try {
    const name = (req.body?.name ?? '').toString().trim();
    const slug = (req.body?.slug ?? '').toString().trim();
    if (name.length < 2) return res.status(400).json({ error: 'نام دسته‌بندی را وارد کنید.' });
    if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
      return res.status(400).json({ error: 'نامک دسته‌بندی باید فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد.' });
    }
    const { rows } = await query(
      `INSERT INTO categories (slug, name, image, description, sort_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [slug, name, (req.body?.image ?? '').toString().trim() || null,
       (req.body?.description ?? '').toString().trim() || null,
       Number.parseInt(req.body?.sortOrder, 10) || 0],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'این نامک قبلاً استفاده شده است.' });
    return next(error);
  }
});

adminRouter.put('/categories/:id', async (req, res, next) => {
  try {
    const name = (req.body?.name ?? '').toString().trim();
    if (name.length < 2) return res.status(400).json({ error: 'نام دسته‌بندی را وارد کنید.' });
    const { rows } = await query(
      `UPDATE categories SET name=$1, image=$2, description=$3, sort_order=$4 WHERE id=$5 RETURNING *`,
      [name, (req.body?.image ?? '').toString().trim() || null,
       (req.body?.description ?? '').toString().trim() || null,
       Number.parseInt(req.body?.sortOrder, 10) || 0, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'دسته‌بندی پیدا نشد.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete('/categories/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT COUNT(*)::int AS total FROM products WHERE category_id = $1', [
      req.params.id,
    ]);
    if (rows[0].total > 0) {
      return res.status(409).json({ error: 'این دسته‌بندی محصول دارد؛ ابتدا محصولات آن را جابه‌جا کنید.' });
    }
    await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

/* ----------------------------------- brands ----------------------------------- */

adminRouter.post('/brands', async (req, res, next) => {
  try {
    const name = (req.body?.name ?? '').toString().trim();
    const slug = (req.body?.slug ?? '').toString().trim();
    if (name.length < 2) return res.status(400).json({ error: 'نام برند را وارد کنید.' });
    if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
      return res.status(400).json({ error: 'نامک برند باید فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشد.' });
    }
    const { rows } = await query(
      `INSERT INTO brands (slug, name, description) VALUES ($1,$2,$3) RETURNING *`,
      [slug, name, (req.body?.description ?? '').toString().trim() || null],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'این نامک قبلاً استفاده شده است.' });
    return next(error);
  }
});

adminRouter.put('/brands/:id', async (req, res, next) => {
  try {
    const name = (req.body?.name ?? '').toString().trim();
    if (name.length < 2) return res.status(400).json({ error: 'نام برند را وارد کنید.' });
    const { rows } = await query(
      `UPDATE brands SET name=$1, description=$2, logo=$3 WHERE id=$4 RETURNING *`,
      [name, (req.body?.description ?? '').toString().trim() || null,
       (req.body?.logo ?? '').toString().trim() || null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'برند پیدا نشد.' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete('/brands/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT COUNT(*)::int AS total FROM products WHERE brand_id = $1', [
      req.params.id,
    ]);
    if (rows[0].total > 0) {
      return res.status(409).json({ error: 'برای این برند محصول ثبت شده است؛ ابتدا محصولات را جابه‌جا کنید.' });
    }
    await query('DELETE FROM brands WHERE id = $1', [req.params.id]);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

/* ---------------------------------- settings ---------------------------------- */

adminRouter.put('/settings', async (req, res, next) => {
  try {
    const storeName = (req.body?.storeName ?? '').toString().trim();
    const announcementText = (req.body?.announcementText ?? '').toString().trim();
    const threshold = Number.parseInt(req.body?.freeShippingThreshold, 10);
    const shippingFee = Number.parseInt(req.body?.shippingFee, 10);
    if (storeName.length < 2) return res.status(400).json({ error: 'نام فروشگاه را وارد کنید.' });
    if (!Number.isFinite(threshold) || threshold < 0) {
      return res.status(400).json({ error: 'حد ارسال رایگان باید عددی مثبت به تومان باشد.' });
    }
    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      return res.status(400).json({ error: 'هزینه ارسال باید عددی مثبت به تومان باشد.' });
    }
    const socials = Array.isArray(req.body?.socials)
      ? req.body.socials
          .filter((item) => item && `${item.name ?? ''}`.trim() && `${item.url ?? ''}`.trim())
          .map((item) => ({ name: `${item.name}`.trim(), url: `${item.url}`.trim() }))
      : [];

    const { rows } = await query(
      `UPDATE store_settings SET
         store_name=$1, tagline=$2, announcement_text=$3, announcement_enabled=$4,
         free_shipping_threshold=$5, shipping_fee=$6, phone=$7, email=$8, address=$9,
         socials=$10::jsonb, logo_url=$11, updated_at = now()
       WHERE id = 1 RETURNING *`,
      [storeName, (req.body?.tagline ?? '').toString().trim(), announcementText,
       Boolean(req.body?.announcementEnabled), threshold, shippingFee,
       (req.body?.phone ?? '').toString().trim() || null,
       (req.body?.email ?? '').toString().trim() || null,
       (req.body?.address ?? '').toString().trim() || null,
       JSON.stringify(socials), (req.body?.logoUrl ?? '').toString().trim() || null],
    );
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

/* ------------------------------- newsletter list ------------------------------ */

adminRouter.get('/newsletter', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, email, created_at FROM newsletter_subscriptions ORDER BY created_at DESC LIMIT 200',
    );
    res.json(rows.map((row) => ({ id: row.id, email: row.email, createdAt: row.created_at })));
  } catch (error) {
    next(error);
  }
});
