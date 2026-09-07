# HAITCH

Redesigned storefront for [haitch-usa.com](https://haitch-usa.com) — a NYC menswear label. Next.js 16 App Router, TypeScript, CSS Modules.

## How it works

- **Catalog** — a static, in-repo line sheet in `lib/catalog.ts`: twelve "Looks" (tailored jackets, trousers, shirts) with copy transcribed from the brand's Website 2.0 Outline. Photos live in `public/looks/look-N/` and are indexed by the generated `lib/looks.json`. Nothing is fetched from Shopify at build or request time; `/shop` and product pages are fully static.
- **Prices and purchasing** — every look carries a `price` from the line sheet (jackets, trousers, and shirts each in their own band), shown on the shop grid and product page. Purchasable variants come from a committed snapshot of the merchant's Shopify products, `lib/shopify-products.json`, written by `npm run sync:shopify` through the Shopify Admin API. At build time `lib/catalog.ts` joins that snapshot to the looks by handle (falling back to title, ignoring case and punctuation); a matched look gets the store's variants (Shopify variant ids, sizes, availability), ordered by the look's line-sheet size run rather than the store's order, and shows the first variant's price; an unmatched look keeps its line-sheet price with no add-to-cart control. The checked-in snapshot has been synced and holds all twelve looks (each a DRAFT-status product in the store), so every look is purchasable.
- **Bag** — client-side cart in `localStorage` (`components/CartContext.tsx`), YSL-style slide-in drawer, keyed by Shopify variant id.
- **Checkout** — custom Bag → Information → Shipping → Payment steps (`/checkout`). PROCEED TO PAYMENT posts the bag and contact/shipping details to `app/api/checkout/route.ts`, which creates a Shopify **draft order** through the Admin API (`lib/shopify-admin.ts`) and returns its invoice URL; the browser is sent to that Shopify-hosted payment page, where Shop Pay / shop.app, Apple Pay, Google Pay and cards appear automatically. Draft orders are used because the products are not published to the Online Store channel, so Shopify's public cart permalinks would refuse them; this was verified live, with a test draft order for a DRAFT-status product producing a working payment page (Shop Pay, Google Pay, cards, shipping and tax calculated). (Shopify does not allow custom payment pages — the hosted checkout is where Shop Pay lives.) Discount codes are not applied automatically on the invoice page.
- **Appointments / newsletter** — post to Formspree. Every form (appointment, newsletter, checkout) validates inline: a message appears under a field once it is blurred or the user tries to advance, and advancing/submitting is blocked until the step passes (`lib/validation.ts`, `components/FieldError.tsx`).
- **Images** — everything is local and served through Next's built-in image optimizer: look photos (`public/looks`), the collections gallery (`public/lookbook`, the LOOKBOOK shoot indexed by `lib/lookbook.json` with real dimensions), the newsletter picture (lookbook frame 1012 per the Website 2.0 Outline deck, resolved as `NEWSLETTER_IMAGE` in `lib/gallery.ts` with a portrait-frame fallback), and the landing hero (`public/home`: a landscape colour frame for desktop and a black-and-white portrait frame for phones, exported as `HERO_IMAGE` / `HERO_IMAGE_MOBILE`). The hero files were downscaled once with sharp from the LOOKBOOK originals and have no import script; regenerate by hand if the frames change. `cdn.shopify.com` remains in `next.config.ts` only so bags saved before the catalog switch can still show their legacy product images.
- **Collections gallery** — three balanced columns of lookbook tiles (`components/GalleryGrid.tsx`, grouping and balancing from `lib/gallery-layout.ts`). Every tile is clickable: a lone frame opens a full-screen viewer; runs of near-identical frames are collapsed into one tile that cycles through its frames on tap with a crossfade and an "i — k" counter, plus a small expand control that opens the current frame full screen (`components/GalleryStack.tsx`). The viewer (`components/GalleryViewer.tsx`) steps frames with arrow keys or side controls and closes on Escape. Tiles rise into view as they scroll on screen and their photos drift slightly on a CSS scroll-driven timeline (both off under reduced motion); on phones the columns collapse to one in shoot order.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest + React Testing Library
npm run lint
npm run build
```

## Syncing products from Shopify

```bash
npm run sync:shopify
```

`scripts/sync-shopify.mjs` reads `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_CLIENT_ID`, and `SHOPIFY_CLIENT_SECRET` from the environment or `.env.local`, exchanges the client credentials for a short-lived Admin API token, pages through every product in the store with the Admin GraphQL `products` query, keeps only the products that belong to the catalog (matching each store product's handle or normalised title against the `handle`/`title` pairs read from `lib/catalog.ts`, and logging "N of M store products belong to the catalog" plus any look with no store product), and writes `lib/shopify-products.json` (`{ syncedAt, products: [{ id, handle, title, status, variants: [{ id, size, price, available }] }] }`, with Shopify GIDs flattened to numeric ids). Commit the JSON: the site reads it at build time and does not query Shopify for product data at request time. Re-run and commit whenever store products, variants, prices, or stock change, then redeploy. Products in the store that match no look are never written to the snapshot — the repository is public and the store also carries internal made-to-measure / bespoke products whose pricing must stay out of it; looks with no store match stay unpurchasable.

## Importing look photography

```bash
npm run import:looks -- ~/path/to/High-res-Ecom   # [--width 2000] [--quality 80]
```

`scripts/import-looks.mjs` reads a folder of `Look N/` directories of high-res JPEGs, downscales each to 2000px wide with sharp (EXIF-rotated, mozjpeg, never enlarged), writes `public/looks/look-N/01.jpg…` in filename order, removes stale output, and regenerates `lib/looks.json`. Do not hand-edit the manifest. Copy (titles, sizes, descriptions, details) is edited in `lib/catalog.ts`.

## Importing the lookbook

```bash
npm run import:lookbook -- ~/path/to/LOOKBOOK   # [--max-width 1600] [--max-height 2000] [--quality 78]
```

`scripts/import-lookbook.mjs` walks the LOOKBOOK folder recursively (root and `BOOKLET SELECTS`, jpg and png), keeps one file per 4-digit frame number in the filename (largest file wins when a frame was exported twice), EXIF-rotates and downscales each to fit inside the max box with sharp (never enlarged), writes `public/lookbook/<frame>.jpg` in frame order, removes stale output, and regenerates `lib/lookbook.json` with each image's `src`, `width`, `height` and a `group` id. Groups mark runs of near-identical frames: walking frames in order, a new group starts when the frame number jumps by 10 or more, a 24×24 greyscale signature differs from the previous frame by a mean pixel distance above 0.2, the orientation flips, or the group already has 6 frames. `/collections` shows each group as one tap-to-cycle tile, so re-running the import recomputes the stacks along with the images (the committed shoot yields 61 tiles from 144 frames). The committed gallery uses the defaults (1600×2000 box, quality 78), which suit a three-column gallery. Do not hand-edit the manifest; `/collections` and the newsletter modal read it through `lib/gallery.ts`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FORMSPREE_ID` | Formspree form ID for the appointment and newsletter forms (create one at formspree.io) |
| `SHOPIFY_STORE_DOMAIN` | The store's `*.myshopify.com` host |
| `SHOPIFY_CLIENT_ID` | Client ID of the store's Dev Dashboard app ("HAITCH website") |
| `SHOPIFY_CLIENT_SECRET` | Client secret of that app — server-side only, never committed or shared |

The Shopify app needs the product read scopes for the sync and the draft-order scopes for checkout. All three Shopify values are used by `npm run sync:shopify` (offline) and by the `/api/checkout` route handler (runtime); they are set in Vercel's project environment and pulled into the gitignored `.env.local` for local work. Without them the site still builds and every page renders, but `/api/checkout` answers 503 and the payment step shows an error. Without the Formspree ID the forms still render but submissions will fail.

## Deploying to Vercel

Zero-config: import the repo in Vercel, set `NEXT_PUBLIC_FORMSPREE_ID` and the three `SHOPIFY_*` variables, deploy. No `vercel.json` needed. Every page is static; `/api/checkout` is the only dynamic route.

## Tests

Behavior tests live in `tests/` — catalog integrity (twelve looks, unique handles, every image on disk), the landing hero (both photos on disk, desktop landscape / mobile portrait, each served to its viewport), both import scripts (run for real with sharp against generated images: resizing, dedupe by frame, stale cleanup, manifests), the Shopify sync (client-credentials token exchange and its failure message, paging and GID flattening, matching store products to looks by handle then title, ignoring foreign products, reading the twelve catalog entries from the real `lib/catalog.ts` source and keeping only their store products, and ordering variants by the line-sheet size run with unknown sizes last), the checkout route (draft order created with the right line items, email, and shipping address and the invoice URL returned; empty bag → 400 with no Shopify call; Shopify user errors → 502; missing env → 503), the collections gallery (every lookbook frame on disk, one visible `img` per stack, tapping a stack advances and wraps with an updated accessible name, a lone-frame tile opens the full-screen viewer and Escape closes it, a stack's expand control opens the viewer where Next / ArrowLeft step and wrap and Close dismisses), the stack/column layout helpers (`stackImages`, generic `balanceColumns`), the product page in both priced and unpriced states, bag behavior (add/quantity/remove/persistence), bag drawer, appointment form field progression, the checkout stepper including the payment hand-off (POST body, navigation to the returned URL, inline error on failure), newsletter modal (including that it shows the lib-resolved `NEWSLETTER_IMAGE`), and shop grid. Form tests assert inline validation messages via accessible descriptions and that nothing is posted or advanced while invalid. Cart and checkout tests use a synthetic purchasable product from `tests/helpers/products.ts`; Shopify is never called for real in tests.
