import { Router } from 'express';
import { pool, query, withTransaction } from '../db.js';
import { requireAuth } from '../auth.js';
import { priceCart } from '../lib.js';
import { mapOrderItem, mapOrderSummary } from './account.js';

export const ordersRouter = Router();

function readCustomer(body) {
  const customerName = (body?.customerName ?? '').toString().trim();
  const phone = (body?.phone ?? '').toString().trim();
  const city = (body?.city ?? '').toString().trim();
  const address = (body?.address ?? '').toString().trim();
  const province = (body?.province ?? '').toString().trim() || null;
  const postalCode = (body?.postalCode ?? '').toString().trim() || null;
  const note = (body?.note ?? '').toString().trim() || null;

  if (customerName.length < 3) return { error: 'نام و نام خانوادگی را کامل وارد کنید.' };
  if (!/^09\d{9}$/.test(phone)) return { error: 'شماره تماس باید با ۰۹ شروع شود و ۱۱ رقم باشد.' };
  if (!city) return { error: 'شهر را وارد کنید.' };
  if (address.length < 10) return { error: 'نشانی را کامل‌تر وارد کنید.' };
  if (postalCode && !/^\d{10}$/.test(postalCode)) return { error: 'کد پستی باید ۱۰ رقم باشد.' };
  return { value: { customerName, phone, province, city, address, postalCode, note } };
}

/** Prices the current cart server-side (never trusting client prices). */
ordersRouter.post('/orders/quote', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const priced = await priceCart(client, req.body?.items, req.body?.couponCode);
    res.json({
      lines: priced.lines.map((line) => ({
        productId: line.productId,
        name: line.name,
        slug: line.slug,
        image: line.image,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
        stock: line.stock,
        stockAdjusted: line.stockAdjusted,
      })),
      unavailable: priced.unavailable,
      coupon: priced.coupon,
      couponCode: priced.couponCode,
      subtotal: priced.subtotal,
      discountTotal: priced.discountTotal,
      shippingTotal: priced.shippingTotal,
      freeShippingThreshold: priced.freeShippingThreshold,
      total: priced.total,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message, unavailable: error.unavailable });
    return next(error);
  } finally {
    client.release();
  }
});

ordersRouter.post('/orders', requireAuth, async (req, res, next) => {
  try {
    const payload = readCustomer(req.body);
    if (payload.error) return res.status(400).json({ error: payload.error });

    const idempotencyKey = (req.body?.idempotencyKey ?? '').toString().trim() || null;

    const result = await withTransaction(async (client) => {
      if (idempotencyKey) {
        const { rows: existing } = await client.query(
          'SELECT * FROM orders WHERE idempotency_key = $1 AND user_id = $2',
          [idempotencyKey, req.user.id],
        );
        if (existing[0]) return { order: existing[0], duplicate: true };
      }

      const priced = await priceCart(client, req.body?.items, req.body?.couponCode);

      const orderNumber = `AB${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`;
      const { rows } = await client.query(
        `INSERT INTO orders
           (order_number, user_id, customer_name, phone, province, city, address, postal_code, note,
            subtotal, discount_total, shipping_total, total, coupon_code, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          orderNumber,
          req.user.id,
          payload.value.customerName,
          payload.value.phone,
          payload.value.province,
          payload.value.city,
          payload.value.address,
          payload.value.postalCode,
          payload.value.note,
          priced.subtotal,
          priced.discountTotal,
          priced.shippingTotal,
          priced.total,
          priced.couponCode,
          idempotencyKey,
        ],
      );
      const order = rows[0];

      for (const line of priced.lines) {
        const stockUpdate = await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock',
          [line.quantity, line.productId],
        );
        if (!stockUpdate.rows[0]) {
          const error = new Error(`موجودی «${line.name}» کافی نیست. لطفاً سبد خرید را به‌روز کنید.`);
          error.status = 409;
          throw error;
        }
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_slug, unit_price, quantity, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [order.id, line.productId, line.name, line.slug, line.unitPrice, line.quantity, line.lineTotal],
        );
      }

      return { order, duplicate: false };
    });

    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [result.order.id]);
    return res.status(result.duplicate ? 200 : 201).json({
      order: { ...mapOrderSummary(result.order), items: items.map(mapOrderItem) },
      duplicate: result.duplicate,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return next(error);
  }
});

/** Public order tracking: the order number must be paired with the buyer's phone. */
ordersRouter.post('/orders/track', async (req, res, next) => {
  try {
    const orderNumber = (req.body?.orderNumber ?? '').toString().trim();
    const phone = (req.body?.phone ?? '').toString().trim();
    if (!orderNumber || !phone) {
      return res.status(400).json({ error: 'شماره سفارش و شماره تماس را وارد کنید.' });
    }
    const { rows } = await query('SELECT * FROM orders WHERE order_number = $1 AND phone = $2', [
      orderNumber,
      phone,
    ]);
    const order = rows[0];
    if (!order) {
      return res.status(404).json({ error: 'سفارشی با این شماره و شماره تماس پیدا نشد.' });
    }
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    return res.json({ ...mapOrderSummary(order), items: items.map(mapOrderItem) });
  } catch (error) {
    return next(error);
  }
});
