import bcrypt from 'bcryptjs';
import { query, waitForDatabase } from './db.js';
import { migrate } from './migrate.js';
import {
  articles,
  banners,
  brands,
  categories,
  coupons,
  products,
  settings,
  vehicleMakes,
} from './seed-data.js';

const isPreview = process.env.BASE44_PREVIEW_MODE === '1';

async function seedSettings() {
  await query(
    `INSERT INTO store_settings
       (id, store_name, tagline, announcement_text, announcement_enabled, announcements,
        free_shipping_threshold, shipping_fee, phone, email, address, socials, hero_image)
     VALUES (1, $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11::jsonb, $12)
     ON CONFLICT (id) DO NOTHING`,
    [
      settings.storeName,
      settings.tagline,
      settings.announcementText,
      settings.announcementEnabled,
      JSON.stringify(settings.announcements),
      settings.freeShippingThreshold,
      settings.shippingFee,
      settings.phone,
      settings.email,
      settings.address,
      JSON.stringify(settings.socials),
      settings.heroImage,
    ],
  );
}

async function seedCategories() {
  for (const category of categories) {
    await query(
      `INSERT INTO categories (slug, name, image, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO NOTHING`,
      [category.slug, category.name, category.image, category.description, category.sortOrder],
    );
  }
}

async function seedBrands() {
  for (const brand of brands) {
    await query(
      `INSERT INTO brands (slug, name, country, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO NOTHING`,
      [brand.slug, brand.name, brand.country ?? null, brand.description],
    );
  }
}

async function seedVehicles() {
  for (const make of vehicleMakes) {
    const { rows } = await query(
      `INSERT INTO vehicle_makes (slug, name, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [make.slug, make.name, make.sortOrder],
    );
    const makeId = rows[0].id;
    let order = 0;
    for (const model of make.models) {
      order += 1;
      await query(
        `INSERT INTO vehicle_models (make_id, slug, name, year_from, year_to, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, make_id = EXCLUDED.make_id`,
        [makeId, model.slug, model.name, model.yearFrom, model.yearTo, order],
      );
    }
  }
}

async function seedProducts() {
  const { rows: categoryRows } = await query('SELECT id, slug FROM categories');
  const { rows: brandRows } = await query('SELECT id, slug FROM brands');
  const { rows: modelRows } = await query('SELECT id, slug FROM vehicle_models');
  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));
  const brandIds = new Map(brandRows.map((row) => [row.slug, row.id]));
  const modelIds = new Map(modelRows.map((row) => [row.slug, row.id]));

  for (const product of products) {
    await query(
      `INSERT INTO products
         (slug, name, part_number, brand_id, category_id, short_description, description, price,
          compare_at_price, stock, image, gallery, specs, warranty, origin,
          is_featured, is_bestseller, is_new, is_demo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18,true)
       ON CONFLICT (slug) DO NOTHING`,
      [
        product.slug,
        product.name,
        product.partNumber ?? null,
        brandIds.get(product.brand) ?? null,
        categoryIds.get(product.category) ?? null,
        product.shortDescription,
        product.description,
        product.price,
        product.compareAtPrice ?? null,
        product.stock,
        product.image,
        JSON.stringify(product.gallery ?? []),
        JSON.stringify(product.specs ?? []),
        product.warranty ?? null,
        product.origin ?? null,
        product.isFeatured ?? false,
        product.isBestseller ?? false,
        product.isNew ?? false,
      ],
    );

    const { rows: productRow } = await query('SELECT id FROM products WHERE slug = $1', [product.slug]);
    const productId = productRow[0]?.id;
    if (!productId) continue;

    for (const modelSlug of product.fitment ?? []) {
      const modelId = modelIds.get(modelSlug);
      if (!modelId) continue;
      await query(
        `INSERT INTO product_fitments (product_id, model_id)
         VALUES ($1, $2)
         ON CONFLICT (product_id, model_id) DO NOTHING`,
        [productId, modelId],
      );
    }
  }
}

async function seedArticles() {
  for (const article of articles) {
    await query(
      `INSERT INTO articles (slug, title, excerpt, body, image, reading_minutes, is_demo)
       VALUES ($1,$2,$3,$4,$5,$6,true)
       ON CONFLICT (slug) DO NOTHING`,
      [article.slug, article.title, article.excerpt, article.body, article.image, article.readingMinutes],
    );
  }
}

async function seedBanners() {
  for (const banner of banners) {
    await query(
      `INSERT INTO promo_banners (slug, title, subtitle, cta_label, cta_href, image, tone, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (slug) DO NOTHING`,
      [
        banner.slug,
        banner.title,
        banner.subtitle,
        banner.ctaLabel,
        banner.ctaHref,
        banner.image,
        banner.tone,
        banner.sortOrder,
      ],
    );
  }
}

async function seedCoupons() {
  for (const coupon of coupons) {
    await query(
      `INSERT INTO coupons (code, percent, amount, min_subtotal, description, is_active)
       VALUES ($1,$2,$3,$4,$5,true)
       ON CONFLICT (code) DO NOTHING`,
      [coupon.code, coupon.percent, coupon.amount, coupon.minSubtotal, coupon.description],
    );
  }
}

/**
 * Development-only administrator account so the dashboard can be reviewed in the
 * sandbox preview. It is created only while BASE44_PREVIEW_MODE === "1" and the
 * password comes from DEV_ADMIN_PASSWORD (see AGENTS.md). Set your own
 * administrator account in any real deployment.
 */
async function seedPreviewAdmin() {
  if (!isPreview) return;
  const email = (process.env.DEV_ADMIN_EMAIL || 'admin@autodrive.example').toLowerCase();
  const password = process.env.DEV_ADMIN_PASSWORD;
  if (!password) return;

  const hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    ['مدیر فروشگاه', email, hash],
  );
  console.log(`[seed] preview administrator ready: ${email}`);
}

export async function seed() {
  await seedSettings();
  await seedCategories();
  await seedBrands();
  await seedVehicles();
  await seedProducts();
  await seedArticles();
  await seedBanners();
  await seedCoupons();
  await seedPreviewAdmin();
}

if (process.argv[1]?.endsWith('seed.js')) {
  await waitForDatabase();
  await migrate();
  await seed();
  console.log('[seed] demo catalogue is ready');
  process.exit(0);
}
