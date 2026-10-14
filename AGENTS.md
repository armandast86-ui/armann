# AGENTS.md — آیدا بیوتی (Aida Beauty)

Persian, fully RTL beauty e-commerce store. React + Vite front end, Express + PostgreSQL API.
This file records only what the manifests do not.

## Running it here (Base44 sandbox)

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- **Only host port 3000 is public.** The Vite dev server owns it and proxies `/api` and
  `/uploads` to the `api` service (`http://api:8000`) over the compose network. That is
  deliberate: a single origin keeps the session cookie first-party, so no CORS or
  `credentials: 'include'` gymnastics are needed.
- Both application services run `npm install` at container start (dependencies live in named
  volumes, not in an image) and then a live-reload dev command. The database is the only
  prebuilt image.
- Migrations and demo seeding run automatically inside the API process at boot
  (`migrate()` then `seed()` in `backend/src/index.js`). There is no separate migration job —
  both are idempotent (`ON CONFLICT DO NOTHING` / `INSERT ... ON CONFLICT`).
- Uploaded product images go to the `uploads` volume (`/app/uploads`), served at `/uploads/*`.

## Environment variables

- **`JWT_SECRET`** — signs session cookies. It is delivered through the platform-managed
  `/run/base44/app.env` (declared in `.base44/environment.json`; a development value is
  auto-generated). Without it the API logs a warning and falls back to an insecure key, so
  always set a real value in production.
- **`BASE44_PREVIEW_MODE`** — when exactly `"1"`, two sandbox-only behaviours switch on:
  Vite's host allowlist is set from `BASE44_SANDBOX_HOST_DOMAIN`, and the API seeds a
  development administrator account. Unset or any other value restores the original
  behaviour (Vite's default host protection, no demo admin).
- **`DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`** — the preview administrator credentials.
  They live in `backend/.env.base44-defaults`, which is listed **before**
  `/run/base44/app.env` so a dashboard-provided value always wins. Defaults:
  `admin@aidabeauty.example` / `ChangeMe-Aida-1404`. **Replace or delete this account before
  any real deployment** — it exists purely to review the dashboard in the preview.
- **Secret precedence**: never put a user-supplied key under compose `environment:`, because
  that permanently outranks `/run/base44/app.env`.

## Quirks worth knowing

- `Vazirmatn` is self-hosted via `@fontsource-variable/vazirmatn` (imported in `main.jsx`), so
  no external font request is needed.
- The Persian UI relies on logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`,
  `text-start/end`). Use those instead of `ml-*`/`mr-*` when editing.
- Ratings and review counts are **computed from the `reviews` table**. Seeded products
  deliberately have no reviews, so cards show no stars until a customer writes one. Do not
  reintroduce fake ratings or review counts.
- "Best selling" ordering aggregates real `order_items`, so it is empty until orders exist.
- Discount percentages are always derived from `compare_at_price` vs `price`; the promo
  banner reads the highest active discount instead of hardcoding a number.
- Orders are priced server-side in `priceCart()` (`backend/src/lib.js`) — never trust client
  prices. Order creation is idempotent through `orders.idempotency_key`.
- Payments are **not** wired to a real gateway. Orders are stored with
  `payment_status = 'unpaid'` and admins change that status by hand.

## Verifying a change

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/          # site
curl -s http://localhost:3000/api/products?limit=2 | head -c 300         # catalogue
curl -s http://localhost:3000/api/settings                               # store settings
```

Then exercise the flow in the browser: the cart re-prices through `POST /api/orders/quote`,
and checkout posts to `POST /api/orders`. Demo catalogue records carry `is_demo = true` so
they stay distinguishable from real inventory.
