import bcrypt from 'bcryptjs';
import { query, waitForDatabase } from './db.js';
import { migrate } from './migrate.js';
import { articles, brands, categories, coupons, products, settings } from './seed-data.js';

const isPreview = process.env.BASE44_PREVIEW_MODE === '1';

async function seedSettings() {
  await query(
    `INSERT INTO store_settings
       (id, store_name, tagline, announcement_text, announcement_enabled,
        free_shipping_threshold, shipping_fee, phone, email, address, socials)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [
      settings.storeName,
      settings.tagline,
      settings.announcementText,
      settings.announcementEnabled,
      settings.freeShippingThreshold,
      settings.shippingFee,
      settings.phone,
      settings.email,
      settings.address,
      JSON.stringify(settings.socials),
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
      `INSERT INTO brands (slug, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [brand.slug, brand.name, brand.description],
    );
  }
}

async function seedProducts() {
  const { rows: categoryRows } = await query('SELECT id, slug FROM categories');
  const { rows: brandRows } = await query('SELECT id, slug FROM brands');
  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));
  const brandIds = new Map(brandRows.map((row) => [row.slug, row.id]));

  for (const product of products) {
    await query(
      `INSERT INTO products
         (slug, name, brand_id, category_id, short_description, description, price,
          compare_at_price, stock, image, gallery, specs, ingredients, usage,
          is_featured, is_new, is_demo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14,$15,$16,true)
       ON CONFLICT (slug) DO NOTHING`,
      [
        product.slug,
        product.name,
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
        product.ingredients ?? null,
        product.usage ?? null,
        product.isFeatured ?? false,
        product.isNew ?? false,
      ],
    );
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
  const email = (process.env.DEV_ADMIN_EMAIL || 'admin@aidabeauty.example').toLowerCase();
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
  await seedProducts();
  await seedArticles();
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
