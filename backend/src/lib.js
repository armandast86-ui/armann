/** Shared catalogue helpers: product projection, filtering and price maths. */

export const PRODUCT_SELECT = `
  SELECT p.*,
         b.name AS brand_name, b.slug AS brand_slug,
         c.name AS category_name, c.slug AS category_slug,
         r.rating, COALESCE(r.review_count, 0) AS review_count,
         COALESCE(s.sold_count, 0) AS sold_count
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN (
    SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS rating, COUNT(*) AS review_count
    FROM reviews WHERE is_approved GROUP BY product_id
  ) r ON r.product_id = p.id
  LEFT JOIN (
    SELECT oi.product_id, SUM(oi.quantity) AS sold_count
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status <> 'cancelled'
    GROUP BY oi.product_id
  ) s ON s.product_id = p.id
`;

export const PRODUCT_ORDER = {
  newest: 'p.created_at DESC',
  'price-asc': 'p.price ASC',
  'price-desc': 'p.price DESC',
  'best-selling': 'sold_count DESC, p.created_at DESC',
  popular: 'review_count DESC, sold_count DESC, p.created_at DESC',
  discount: `CASE WHEN p.compare_at_price > p.price
                  THEN (p.compare_at_price - p.price)::numeric / p.compare_at_price
                  ELSE 0 END DESC, p.created_at DESC`,
  default: 'p.is_featured DESC, p.created_at DESC',
};

export function toPositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function discountPercent(price, compareAtPrice) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function mapProduct(row) {
  const price = Number(row.price);
  const compareAtPrice = row.compare_at_price === null ? null : Number(row.compare_at_price);
  const hasDiscount = compareAtPrice !== null && compareAtPrice > price;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand_name ? { name: row.brand_name, slug: row.brand_slug } : null,
    category: row.category_name ? { name: row.category_name, slug: row.category_slug } : null,
    shortDescription: row.short_description,
    description: row.description,
    price,
    compareAtPrice: hasDiscount ? compareAtPrice : null,
    discountPercent: hasDiscount ? discountPercent(price, compareAtPrice) : 0,
    stock: row.stock,
    inStock: row.stock > 0,
    image: row.image,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    specs: Array.isArray(row.specs) ? row.specs : [],
    ingredients: row.ingredients,
    usage: row.usage,
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    reviewCount: Number(row.review_count ?? 0),
    soldCount: Number(row.sold_count ?? 0),
    isFeatured: Boolean(row.is_featured),
    isNew: Boolean(row.is_new),
    isDemo: Boolean(row.is_demo),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

/**
 * Builds the WHERE clause for a catalogue query from raw request params.
 * `includeInactive` is used by the admin list only.
 */
export function buildProductFilters(params, { includeInactive = false } = {}) {
  const clauses = [];
  const values = [];
  const push = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (!includeInactive) clauses.push('p.is_active = true');

  if (params.query) {
    const term = `%${String(params.query).trim()}%`;
    const ref = push(term);
    clauses.push(`(p.name ILIKE ${ref} OR p.short_description ILIKE ${ref} OR p.description ILIKE ${ref} OR b.name ILIKE ${ref})`);
  }
  if (params.category) clauses.push(`c.slug = ${push(params.category)}`);
  if (params.brand) clauses.push(`b.slug = ${push(params.brand)}`);

  const minPrice = Number.parseInt(params.minPrice, 10);
  if (Number.isFinite(minPrice)) clauses.push(`p.price >= ${push(minPrice)}`);
  const maxPrice = Number.parseInt(params.maxPrice, 10);
  if (Number.isFinite(maxPrice)) clauses.push(`p.price <= ${push(maxPrice)}`);

  if (params.inStock === 'true' || params.inStock === true) clauses.push('p.stock > 0');
  if (params.onSale === 'true' || params.onSale === true) clauses.push('p.compare_at_price > p.price');
  if (params.featured === 'true' || params.featured === true) clauses.push('p.is_featured = true');

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
    order: PRODUCT_ORDER[params.sort] || PRODUCT_ORDER.default,
  };
}

/** Server-side cart pricing. Prices, stock and coupons always come from the database. */
export async function priceCart(client, items, couponCode) {
  const normalized = [];
  for (const item of items ?? []) {
    const productId = toPositiveInt(item.productId ?? item.id);
    const quantity = toPositiveInt(item.quantity) ?? 1;
    if (!productId) continue;
    normalized.push({ productId, quantity: Math.min(quantity, 99) });
  }
  if (!normalized.length) {
    const error = new Error('سبد خرید شما خالی است.');
    error.status = 400;
    throw error;
  }

  const ids = normalized.map((item) => item.productId);
  const { rows } = await client.query('SELECT * FROM products WHERE id = ANY($1::int[])', [ids]);
  const byId = new Map(rows.map((row) => [row.id, row]));

  const lines = [];
  const unavailable = [];
  for (const item of normalized) {
    const product = byId.get(item.productId);
    if (!product || !product.is_active) {
      unavailable.push({ productId: item.productId, reason: 'این محصول در فروشگاه موجود نیست.' });
      continue;
    }
    if (product.stock <= 0) {
      unavailable.push({ productId: item.productId, name: product.name, reason: 'این محصول موجود نیست.' });
      continue;
    }
    const quantity = Math.min(item.quantity, product.stock);
    const unitPrice = Number(product.price);
    lines.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      requestedQuantity: item.quantity,
      stock: product.stock,
      stockAdjusted: quantity !== item.quantity,
    });
  }

  if (!lines.length) {
    const error = new Error('هیچ‌کدام از محصولات سبد خرید در حال حاضر قابل خرید نیستند.');
    error.status = 400;
    error.unavailable = unavailable;
    throw error;
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  let discountTotal = 0;
  let coupon = null;
  if (couponCode) {
    const code = String(couponCode).trim().toUpperCase();
    const { rows: couponRows } = await client.query(
      `SELECT * FROM coupons
       WHERE code = $1 AND is_active = true
         AND (expires_at IS NULL OR expires_at > now())`,
      [code],
    );
    const found = couponRows[0];
    if (!found) {
      const error = new Error('کد تخفیف وارد‌شده معتبر نیست.');
      error.status = 400;
      throw error;
    }
    if (subtotal < found.min_subtotal) {
      const error = new Error(
        `این کد تخفیف برای سفارش‌های بالای ${found.min_subtotal.toLocaleString('fa-IR')} تومان فعال است.`,
      );
      error.status = 400;
      throw error;
    }
    if (found.percent) discountTotal = Math.round((subtotal * found.percent) / 100);
    else if (found.amount) discountTotal = Math.min(found.amount, subtotal);
    coupon = { code: found.code, percent: found.percent, amount: found.amount, description: found.description };
  }

  const { rows: settingsRows } = await client.query('SELECT * FROM store_settings WHERE id = 1');
  const settings = settingsRows[0] ?? {};
  const threshold = Number(settings.free_shipping_threshold ?? 0);
  const fee = Number(settings.shipping_fee ?? 0);
  const payable = subtotal - discountTotal;
  const shippingTotal = threshold > 0 && payable >= threshold ? 0 : fee;

  return {
    lines,
    unavailable,
    coupon,
    couponCode: coupon?.code ?? null,
    subtotal,
    discountTotal,
    shippingTotal,
    freeShippingThreshold: threshold,
    total: Math.max(payable + shippingTotal, 0),
  };
}
