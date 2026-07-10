# Noridoc: lib

Path: @/lib

### Overview

Framework-agnostic data and utility modules: Shopify catalog fetching/normalization, checkout permalink construction, price formatting, the Shopify CDN image loader, and curated editorial image URLs. No React components live here (the image loader is 'use client' only because Next requires it for custom loaders).

### How it fits into the larger codebase

This is the only place the app talks to Shopify. Pages in @/app call `getProducts`/`getProduct`; @/components/CheckoutFlow.tsx calls `buildCheckoutUrl`; nearly every component uses `formatPrice`; @/app/page.tsx and @/app/collections/page.tsx consume @/lib/gallery.ts. The `Product`/`ProductVariant` types exported from @/lib/shopify.ts are the canonical catalog shape used throughout components and the cart.

### Core Implementation

- @/lib/shopify.ts — `getProducts()` fetches `https://haitch-usa.com/products.json?limit=250` with `next: { revalidate: 600 }` (ISR). `normalizeProducts()` converts the raw Shopify payload into the internal `Product` shape: strips HTML from `body_html` into a plain description, coerces string prices to numbers (product `price` = first variant's price), sorts images by `position`, and maps variants to `{ id, size, price, available }` (Shopify variant `title` becomes `size`). Any fetch/parse failure falls back to the committed real-store snapshot at @/lib/fixtures/products.json. `getProduct(handle)` is a find over `getProducts()`.
- @/lib/checkout.ts — `buildCheckoutUrl(lines, info?)` produces a Shopify cart permalink: path is comma-joined `{variantId}:{quantity}` pairs on `https://haitch-usa.com/cart/`, and optional `CheckoutInfo` fields map through `PARAM_MAP` to `checkout[email]` / `checkout[shipping_address][...]` query params that prefill Shopify's hosted checkout. Empty/absent fields are omitted; with no info the URL has no query string.
- @/lib/image-loader.ts — custom `next/image` loader (registered in @/next.config.ts) that appends `width=` to the CDN URL; Shopify's CDN resizes natively, so no Vercel image optimization is used.
- @/lib/format.ts — `formatPrice` renders `$` amounts, dropping cents for whole-dollar values.
- @/lib/gallery.ts — `HERO_IMAGE` and `GALLERY_IMAGES`: hardcoded Shopify CDN URLs scraped from the live gallery page, in page order.

### Things to Know

- There are no Shopify API credentials anywhere; `products.json` is Shopify's public storefront endpoint. This frontend only reads — writes (inventory, orders, payment) all happen on the Shopify side after checkout handoff.
- The fixture in @/lib/fixtures/products.json is real store data, not synthetic; tests in @/tests normalize it directly and assert against real handles/prices, so replacing it will break tests.
- Variant IDs from Shopify are the join key across the system: they identify bag lines in @/components/CartContext.tsx and become the `{variantId}:{qty}` segments in checkout permalinks.
- Gallery URLs include `?v=` cache-busting params; the image loader accounts for this by appending `&width=` when a `?` is already present.

Created and maintained by Nori.
