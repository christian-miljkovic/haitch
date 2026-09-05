# Noridoc: lib

Path: @/lib

### Overview

Framework-agnostic data and utility modules: the canonical `Product` types, the static in-repo catalog and its generated image manifest, the generated lookbook gallery manifest with its stacking and column-balancing helpers, checkout permalink construction, price formatting, the Shopify CDN image loader used by the landing hero, and the shared form field validators. No React components live here.

### How it fits into the larger codebase

Pages in @/app call `getProducts`/`getProduct` from @/lib/catalog.ts; @/components/CheckoutFlow.tsx calls `buildCheckoutUrl`; components and the cart use `formatPrice` and the types in @/lib/product.ts; @/app/page.tsx, @/app/collections/page.tsx, and @/components/NewsletterModal.tsx consume @/lib/gallery.ts; the three forms in @/components consume @/lib/validation.ts. @/lib/looks.json is written by @/scripts/import-looks.mjs and read only by the catalog; @/lib/lookbook.json is written by @/scripts/import-lookbook.mjs and read only by @/lib/gallery.ts. The Shopify store is no longer a data source — `STORE_URL` in @/lib/shopify.ts exists solely so checkout permalinks point at the hosted store.

```
scripts/import-looks.mjs ──writes──▶ lib/looks.json + public/looks/look-N/NN.jpg
                                          │
lib/catalog.ts (LOOKS copy) ──joins by look number──▶ Product[] ──▶ app/shop, app/products/[handle]

scripts/import-lookbook.mjs ──writes──▶ lib/lookbook.json + public/lookbook/NNNN.jpg
                                          │
lib/gallery.ts ──GALLERY_IMAGES { src, width, height, group }[]──▶ components/NewsletterModal
       │
       └─stackImages (lib/gallery-layout.ts)──▶ GALLERY_STACKS { width, height, images[] }[]──▶ app/collections
```

### Core Implementation

- @/lib/product.ts — `Product`, `ProductVariant`, `ProductDetailGroup`. `price` is optional (UI hides it when undefined); `sizes` is a display-only string from the line sheet (e.g. `44, 46, 48 EU`); `details` is a list of `{ heading, items }` groups ("Styling Details", "Materials and Product Care"); `variants` may be empty.
- @/lib/catalog.ts — a `LOOKS` array of hand-edited copy (title, sizes, description, details) transcribed from the brand's "Website 2.0 Outline" line sheet, one entry per studio look. At module load it is mapped to `Product[]`: `id` is the look number, `handle` is the entry's explicit `handle` field (kept stable independently of the title because it forms the product URL and is persisted in visitors' bags), `images` are looked up from @/lib/looks.json by look number, and `variants` is always `[]`. `getProducts()` returns the array in line-sheet order (jackets, then trousers, then shirts), which is the `/shop` display order; `getProduct(handle)` is a find. Both are synchronous.
- @/lib/looks.json — generated manifest `{ looks: [{ look, images: ['/looks/look-N/01.jpg', …] }] }`. Do not hand-edit; regenerate with `npm run import:looks -- <sourceDir>`.
- @/lib/checkout.ts — `buildCheckoutUrl(lines, info?)` produces a Shopify cart permalink: path is comma-joined `{variantId}:{quantity}` pairs on `${STORE_URL}/cart/`, and optional `CheckoutInfo` fields map through `PARAM_MAP` to `checkout[email]` / `checkout[shipping_address][...]` query params that prefill Shopify's hosted checkout. Empty/absent fields are omitted; with no info the URL has no query string.
- @/lib/shopify-image.ts — `shopifyImageLoader` appends `width=` (or `&width=` when a `?` is already present) so Shopify's CDN resizes natively. It is passed explicitly by @/app/page.tsx for the hero only; there is no global loader.
- @/lib/format.ts — `formatPrice` renders `$` amounts, dropping cents for whole-dollar values.
- @/lib/gallery.ts — `HERO_IMAGE` and `HERO_IMAGE_MOBILE` remain Shopify CDN URLs for the landing hero. `GALLERY_IMAGES: GalleryImage[]` (`{ src, width, height, group }`) is read straight from @/lib/lookbook.json — local `/lookbook/<frame>.jpg` paths in shoot order with their output dimensions and the importer's stack `group` id, so consumers can pass true intrinsic sizes to `next/image`. `GALLERY_STACKS = stackImages(GALLERY_IMAGES)` is the same frames folded into one entry per run of similar shots; `/collections` lays out stacks while the newsletter modal picks from the flat list.
- @/lib/lookbook.json — generated manifest `{ images: [{ src, width, height, group }] }`. Do not hand-edit; regenerate with `npm run import:lookbook -- <folder>`. The importer walks the LOOKBOOK folder recursively, keeps one file per 4-digit frame number (largest file wins when a frame was exported twice), EXIF-rotates and downscales with sharp to fit inside a max box without enlarging, wipes stale output, and records each JPEG's final dimensions. Frames are mixed portrait and landscape. After writing each output it also computes a small greyscale signature (`SIGNATURE_SIZE` square) and, walking frames in order, assigns `group` ids: a new group starts when the camera frame number jumps by `GROUP_FRAME_GAP` (10) or more, the mean pixel distance to the previous frame exceeds `GROUP_MAX_DISTANCE` (0.2), the orientation flips between portrait and landscape, or the group already holds `GROUP_MAX_SIZE` (6) frames. Signatures are used only during import and are not written to the manifest; the process is deterministic and re-runnable.
- @/lib/gallery-layout.ts — two pure, unit-tested helpers. `stackImages(images)` folds consecutive `GalleryImage`s sharing a `group` into `GalleryStack = { width, height, images[] }`, sized by the stack's first frame; only *adjacent* equal groups merge, so shoot order is preserved and a group id reappearing later would form a separate stack. `balanceColumns(items, count)` is generic over anything with `width`/`height` (`Sized`): shortest-column-first distribution into `count` columns, returning `Placed<T> = { item, index, scale }` where `index` is the source position and `scale` (≤ 1) is the per-column factor that equalises column heights. `stackImages` is consumed by @/lib/gallery.ts, `balanceColumns` by @/app/collections/page.tsx.
- @/lib/validation.ts — `Validator = (value) => string | null` (message or valid). `required(message)` trims and checks non-empty; `email` tests against `EMAIL_RE` from @/lib/format.ts; `phone` requires at least seven digits after stripping non-digits; `optionalPhone` applies `phone` only when the value is non-empty; `none` always passes. Message copy for email/phone is fixed here; `required` takes its message from the caller.

### Things to Know

- Handles are fixed slug-style handles (e.g. `tuxedo-jacket-in-black-barathea`) deliberately shaped like Shopify's own handle generation, so a future reconnection can map catalog entries to store products by handle.
- Prices are absent on purpose: the line sheet listed every price as "$X". When Shopify products exist, each entry needs a `price` and `variants` with real Shopify variant IDs, because `variantId` is still what the cart (@/components/CartContext.tsx) and checkout permalinks key on.
- Editing copy happens in @/lib/catalog.ts; editing photos happens by re-running the import script, which wipes and rewrites @/public/looks and @/lib/looks.json. The catalog test in @/tests/catalog.test.ts asserts every manifest path exists on disk, so the two must be committed together. The same holds for @/lib/lookbook.json and @/public/lookbook, checked by @/tests/collections.test.tsx.
- `EMAIL_RE` is shared: @/lib/format.ts owns it and @/lib/validation.ts imports it, so the checkout, appointment, and newsletter forms all accept the same email shape.
- There are still no Shopify API credentials anywhere. The former live `products.json` fetch, `normalizeProducts`, and the recorded fixture were removed with this change and live only in git history.
- Stack membership is decided at import time, not in the app: the grouping thresholds (`GROUP_FRAME_GAP`, `GROUP_MAX_DISTANCE`, `GROUP_MAX_SIZE`, `SIGNATURE_SIZE`) live in @/scripts/import-lookbook.mjs, and re-running `npm run import:lookbook` recomputes every `group` id along with the images. Changing how frames stack means editing the script and re-importing, not editing the manifest.
- @/lib/gallery.ts imports `stackImages` from @/lib/gallery-layout.ts, which imports the `GalleryImage` type back from @/lib/gallery.ts. The reverse edge is `import type`, erased at compile time, so there is no runtime circular evaluation.

Created and maintained by Nori.
