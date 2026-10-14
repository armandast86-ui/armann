import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { PRODUCT_SELECT, mapProduct } from '../lib.js';

// Every route in this router is guarded individually so that the router can be
// mounted on the shared /api prefix without shadowing the public catalogue.
export const accountRouter = Router();

/* ---------------------------------- addresses --------------------------------- */

function readAddress(body) {
  const fullName = (body?.fullName ?? '').toString().trim();
  const phone = (body?.phone ?? '').toString().trim();
  const city = (body?.city ?? '').toString().trim();
  const address = (body?.address ?? '').toString().trim();
  const province = (body?.province ?? '').toString().trim() || null;
  const postalCode = (body?.postalCode ?? '').toString().trim() || null;

  if (fullName.length < 3) return { error: 'نام گیرنده را کامل وارد کنید.' };
  if (!/^09\d{9}$/.test(phone)) return { error: 'شماره تماس باید با ۰۹ شروع شود و ۱۱ رقم باشد.' };
  if (!city) return { error: 'شهر را وارد کنید.' };
  if (address.length < 10) return { error: 'نشانی را کامل‌تر وارد کنید.' };
  if (postalCode && !/^\d{10}$/.test(postalCode)) return { error: 'کد پستی باید ۱۰ رقم باشد.' };
  return {
    value: { fullName, phone, city, address, province, postalCode, isDefault: Boolean(body?.isDefault) },
  };
}

function mapAddress(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    province: row.province,
    city: row.city,
    address: row.address,
    postalCode: row.postal_code,
    isDefault: row.is_default,
  };
}

accountRouter.get('/addresses', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC',
      [req.user.id],
    );
    res.json(rows.map(mapAddress));
  } catch (error) {
    next(error);
  }
});

accountRouter.post('/addresses', requireAuth, async (req, res, next) => {
  try {
    const payload = readAddress(req.body);
    if (payload.error) return res.status(400).json({ error: payload.error });
    const { fullName, phone, city, address, province, postalCode, isDefault } = payload.value;

    if (isDefault) await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    const { rows } = await query(
      `INSERT INTO addresses (user_id, full_name, phone, province, city, address, postal_code, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, fullName, phone, province, city, address, postalCode, isDefault],
    );
    return res.status(201).json(mapAddress(rows[0]));
  } catch (error) {
    return next(error);
  }
});

accountRouter.put('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const payload = readAddress(req.body);
    if (payload.error) return res.status(400).json({ error: payload.error });
    const { fullName, phone, city, address, province, postalCode, isDefault } = payload.value;

    if (isDefault) await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    const { rows } = await query(
      `UPDATE addresses
       SET full_name=$1, phone=$2, province=$3, city=$4, address=$5, postal_code=$6, is_default=$7
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [fullName, phone, province, city, address, postalCode, isDefault, req.params.id, req.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'این نشانی پیدا نشد.' });
    return res.json(mapAddress(rows[0]));
  } catch (error) {
    return next(error);
  }
});

accountRouter.delete('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------- wishlist ---------------------------------- */

accountRouter.get('/wishlist', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `${PRODUCT_SELECT}
       JOIN wishlist_items w ON w.product_id = p.id AND w.user_id = $1
       WHERE p.is_active = true
       ORDER BY w.created_at DESC`,
      [req.user.id],
    );
    res.json(rows.map(mapProduct));
  } catch (error) {
    next(error);
  }
});

accountRouter.post('/wishlist', requireAuth, async (req, res, next) => {
  try {
    const productId = Number.parseInt(req.body?.productId, 10);
    if (!Number.isFinite(productId)) return res.status(400).json({ error: 'محصول نامعتبر است.' });
    await query(
      `INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [req.user.id, productId],
    );
    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

accountRouter.delete('/wishlist/:productId', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [
      req.user.id,
      req.params.productId,
    ]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

/* ----------------------------------- orders ----------------------------------- */

accountRouter.get('/orders', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*, COUNT(oi.id)::int AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id],
    );
    res.json(rows.map(mapOrderSummary));
  } catch (error) {
    next(error);
  }
});

accountRouter.get('/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const orderId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(orderId)) return res.status(404).json({ error: 'سفارش پیدا نشد.' });
    const { rows } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'سفارش پیدا نشد.' });
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی به این سفارش مجاز نیست.' });
    }
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    return res.json({ ...mapOrderSummary(order), items: items.map(mapOrderItem) });
  } catch (error) {
    return next(error);
  }
});

export function mapOrderSummary(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    customerName: row.customer_name,
    phone: row.phone,
    province: row.province,
    city: row.city,
    address: row.address,
    postalCode: row.postal_code,
    note: row.note,
    subtotal: Number(row.subtotal),
    discountTotal: Number(row.discount_total),
    shippingTotal: Number(row.shipping_total),
    total: Number(row.total),
    couponCode: row.coupon_code,
    itemCount: row.item_count === undefined ? undefined : Number(row.item_count),
    createdAt: row.created_at,
  };
}

export function mapOrderItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.product_name,
    slug: row.product_slug,
    unitPrice: Number(row.unit_price),
    quantity: row.quantity,
    lineTotal: Number(row.line_total),
  };
}
