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
  // Curated bestsellers first, then real sales volume.
  'best-selling': 'p.is_bestseller DESC, sold_count DESC, p.created_at DESC',
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
    partNumber: row.part_number ?? null,
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
    warranty: row.warranty,
    origin: row.origin,
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    reviewCount: Number(row.review_count ?? 0),
    soldCount: Number(row.sold_count ?? 0),
    isFeatured: Boolean(row.is_featured),
    isBestseller: Boolean(row.is_bestseller),
    isNew: Boolean(row.is_new),
    isDemo: Boolean(row.is_demo),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

/** Attaches the list of compatible vehicle models to a mapped product. */
export async function attachCompatibility(client, product) {
  const { rows } = await client.query(
    `SELECT vm.name AS model_name, vm.slug AS model_slug, vm.year_from, vm.year_to,
            vk.name AS make_name, vk.slug AS make_slug
     FROM product_fitments f
     JOIN vehicle_models vm ON vm.id = f.model_id
     JOIN vehicle_makes vk ON vk.id = vm.make_id
     WHERE f.product_id = $1
     ORDER BY vk.sort_order, vm.sort_order`,
    [product.id],
  );
  return {
    ...product,
    compatibility: rows.map((row) => ({
      make: { name: row.make_name, slug: row.make_slug },
      model: { name: row.model_name, slug: row.model_slug },
      yearFrom: row.year_from,
      yearTo: row.year_to,
    })),
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
    clauses.push(
      `(p.name ILIKE ${ref} OR p.short_description ILIKE ${ref} OR p.description ILIKE ${ref} OR p.part_number ILIKE ${ref} OR b.name ILIKE ${ref})`,
    );
  }
  if (params.category) clauses.push(`c.slug = ${push(params.category)}`);
  if (params.brand) clauses.push(`b.slug = ${push(params.brand)}`);
  if (params.onSale === 'true') clauses.push('p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price');
  if (params.inStock === 'true') clauses.push('p.stock > 0');
  if (params.featured === 'true') clauses.push('p.is_featured = true');
  if (params.minPrice) clauses.push(`p.price >= ${push(Number(params.minPrice))}`);
  if (params.maxPrice) clauses.push(`p.price <= ${push(Number(params.maxPrice))}`);

  // Vehicle fitment: keep products compatible with the selected make / model / year.
  if (params.make) {
    clauses.push(
      `EXISTS (SELECT 1 FROM product_fitments f
               JOIN vehicle_models vm ON vm.id = f.model_id
               JOIN vehicle_makes vk ON vk.id = vm.make_id
               WHERE f.product_id = p.id AND vk.slug = ${push(params.make)})`,
    );
  }
  if (params.model) {
    clauses.push(
      `EXISTS (SELECT 1 FROM product_fitments f
               JOIN vehicle_models vm ON vm.id = f.model_id
               WHERE f.product_id = p.id AND vm.slug = ${push(params.model)})`,
    );
  }
  if (params.year) {
    const year = Number(params.year);
    clauses.push(
      `EXISTS (SELECT 1 FROM product_fitments f
               WHERE f.product_id = p.id
                 AND (f.year_from IS NULL OR f.year_from <= ${push(year)})
                 AND (f.year_to IS NULL OR f.year_to >= ${push(year)}))`,
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const order = PRODUCT_ORDER[params.sort] ?? PRODUCT_ORDER.default;
  return { where, values, order };
}

/**
 * Prices a client-side cart against the database. Always the source of truth:
 * never trust prices sent by the browser.
 */
export async function priceCart(client, items, couponCode) {
  const lines = [];
  const unavailable = [];

  for (const item of items) {
    const { rows } = await client.query('SELECT * FROM products WHERE id = $1', [item.productId]);
    const product = rows[0];
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
