# Noridoc: lib

Path: @/lib

### Overview

Framework-agnostic data and utility modules: the canonical `Product` types, the static in-repo catalog and its generated image manifest, the generated lookbook gallery manifest, checkout permalink construction, price formatting, the Shopify CDN image loader used by the landing hero, and the shared form field validators. No React components live here.

### How it fits into the larger codebase

Pages in @/app call `getProducts`/`getProduct` from @/lib/catalog.ts; @/components/CheckoutFlow.tsx calls `buildCheckoutUrl`; components and the cart use `formatPrice` and the types in @/lib/product.ts; @/app/page.tsx, @/app/collections/page.tsx, and @/components/NewsletterModal.tsx consume @/lib/gallery.ts; the three forms in @/components consume @/lib/validation.ts. @/lib/looks.json is written by @/scripts/import-looks.mjs and read only by the catalog; @/lib/lookbook.json is written by @/scripts/import-lookbook.mjs and read only by @/lib/gallery.ts. The Shopify store is no longer a data source — `STORE_URL` in @/lib/shopify.ts exists solely so checkout permalinks point at the hosted store.

```
scripts/import-looks.mjs ──writes──▶ lib/looks.json + public/looks/look-N/NN.jpg
                                          │
lib/catalog.ts (LOOKS copy) ──joins by look number──▶ Product[] ──▶ app/shop, app/products/[handle]

scripts/import-lookbook.mjs ──writes──▶ lib/lookbook.json + public/lookbook/NNNN.jpg
                                          │
lib/gallery.ts ──GALLERY_IMAGES { src, width, height }[]──▶ app/collections, components/NewsletterModal
```

### Core Implementation

- @/lib/product.ts — `Product`, `ProductVariant`, `ProductDetailGroup`. `price` is optional (UI hides it when undefined); `sizes` is a display-only string from the line sheet (e.g. `44, 46, 48 EU`); `details` is a list of `{ heading, items }` groups ("Styling Details", "Materials and Product Care"); `variants` may be empty.
- @/lib/catalog.ts — a `LOOKS` array of hand-edited copy (title, sizes, description, details) transcribed from the brand's "Website 2.0 Outline" line sheet, one entry per studio look. At module load it is mapped to `Product[]`: `id` is the look number, `handle` is the entry's explicit `handle` field (kept stable independently of the title because it forms the product URL and is persisted in visitors' bags), `images` are looked up from @/lib/looks.json by look number, and `variants` is always `[]`. `getProducts()` returns the array in line-sheet order (jackets, then trousers, then shirts), which is the `/shop` display order; `getProduct(handle)` is a find. Both are synchronous.
- @/lib/looks.json — generated manifest `{ looks: [{ look, images: ['/looks/look-N/01.jpg', …] }] }`. Do not hand-edit; regenerate with `npm run import:looks -- <sourceDir>`.
- @/lib/checkout.ts — `buildCheckoutUrl(lines, info?)` produces a Shopify cart permalink: path is comma-joined `{variantId}:{quantity}` pairs on `${STORE_URL}/cart/`, and optional `CheckoutInfo` fields map through `PARAM_MAP` to `checkout[email]` / `checkout[shipping_address][...]` query params that prefill Shopify's hosted checkout. Empty/absent fields are omitted; with no info the URL has no query string.
- @/lib/shopify-image.ts — `shopifyImageLoader` appends `width=` (or `&width=` when a `?` is already present) so Shopify's CDN resizes natively. It is passed explicitly by @/app/page.tsx for the hero only; there is no global loader.
- @/lib/format.ts — `formatPrice` renders `$` amounts, dropping cents for whole-dollar values.
- @/lib/gallery.ts — `HERO_IMAGE` and `HERO_IMAGE_MOBILE` remain Shopify CDN URLs for the landing hero. `GALLERY_IMAGES: GalleryImage[]` (`{ src, width, height }`) is read straight from @/lib/lookbook.json — local `/lookbook/<frame>.jpg` paths in shoot order with their output dimensions, so consumers can pass true intrinsic sizes to `next/image`.
- @/lib/lookbook.json — generated manifest `{ images: [{ src, width, height }] }`. Do not hand-edit; regenerate with `npm run import:lookbook -- <folder>`. The importer walks the LOOKBOOK folder recursively, keeps one file per 4-digit frame number (largest file wins when a frame was exported twice), EXIF-rotates and downscales with sharp to fit inside a max box without enlarging, wipes stale output, and records each JPEG's final dimensions. Frames are mixed portrait and landscape.
- @/lib/validation.ts — `Validator = (value) => string | null` (message or valid). `required(message)` trims and checks non-empty; `email` tests against `EMAIL_RE` from @/lib/format.ts; `phone` requires at least seven digits after stripping non-digits; `optionalPhone` applies `phone` only when the value is non-empty; `none` always passes. Message copy for email/phone is fixed here; `required` takes its message from the caller.

### Things to Know

- Handles are fixed slug-style handles (e.g. `tuxedo-jacket-in-black-barathea`) deliberately shaped like Shopify's own handle generation, so a future reconnection can map catalog entries to store products by handle.
- Prices are absent on purpose: the line sheet listed every price as "$X". When Shopify products exist, each entry needs a `price` and `variants` with real Shopify variant IDs, because `variantId` is still what the cart (@/components/CartContext.tsx) and checkout permalinks key on.
- Editing copy happens in @/lib/catalog.ts; editing photos happens by re-running the import script, which wipes and rewrites @/public/looks and @/lib/looks.json. The catalog test in @/tests/catalog.test.ts asserts every manifest path exists on disk, so the two must be committed together. The same holds for @/lib/lookbook.json and @/public/lookbook, checked by @/tests/collections.test.tsx.
- `EMAIL_RE` is shared: @/lib/format.ts owns it and @/lib/validation.ts imports it, so the checkout, appointment, and newsletter forms all accept the same email shape.
- There are still no Shopify API credentials anywhere. The former live `products.json` fetch, `normalizeProducts`, and the recorded fixture were removed with this change and live only in git history.

Created and maintained by Nori.
