# HAITCH

Redesigned storefront for [haitch-usa.com](https://haitch-usa.com) — a NYC menswear label. Next.js 16 App Router, TypeScript, CSS Modules.

## How it works

- **Catalog** — a static, in-repo line sheet in `lib/catalog.ts`: twelve "Looks" (tailored jackets, trousers, shirts) with copy transcribed from the brand's Website 2.0 Outline. Photos live in `public/looks/look-N/` and are indexed by the generated `lib/looks.json`. Nothing is fetched from Shopify; `/shop` and product pages are fully static.
- **Prices and purchasing** — intentionally absent for now. The new looks do not exist in Shopify yet, so every product has no `price` and no `variants`; the product page hides the price and the add-to-cart control until those are supplied.
- **Bag** — client-side cart in `localStorage` (`components/CartContext.tsx`), YSL-style slide-in drawer.
- **Checkout** — custom Bag → Information → Shipping steps (`/checkout`), then a hand-off to Shopify's hosted checkout via a cart permalink with contact/address prefilled. Shop Pay / shop.app, Apple Pay, Google Pay and cards all appear there automatically. (Shopify does not allow custom payment pages — the hosted checkout is where Shop Pay lives.)
- **Appointments / newsletter** — post to Formspree.
- **Images** — look photos are local and served through Next's built-in image optimizer. The landing hero, collections gallery and newsletter image still come from the Shopify CDN (allowlisted in `next.config.ts`); only the hero uses the explicit `lib/shopify-image.ts` loader.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest + React Testing Library
npm run lint
npm run build
```

## Importing look photography

```bash
npm run import:looks -- ~/path/to/High-res-Ecom   # [--width 2000] [--quality 80]
```

`scripts/import-looks.mjs` reads a folder of `Look N/` directories of high-res JPEGs, downscales each to 2000px wide with sharp (EXIF-rotated, mozjpeg, never enlarged), writes `public/looks/look-N/01.jpg…` in filename order, removes stale output, and regenerates `lib/looks.json`. Do not hand-edit the manifest. Copy (titles, sizes, descriptions, details) is edited in `lib/catalog.ts`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FORMSPREE_ID` | Formspree form ID for the appointment form (create one at formspree.io) |

Without it the appointment form still renders but submissions will fail.

## Deploying to Vercel

Zero-config: import the repo in Vercel, set `NEXT_PUBLIC_FORMSPREE_ID`, deploy. No `vercel.json` needed.

## Tests

Behavior tests live in `tests/` — catalog integrity (twelve looks, unique handles, every image on disk), the photo import script (run for real against generated JPEGs), the product page in both priced and unpriced states, checkout permalink construction, bag behavior (add/quantity/remove/persistence), bag drawer, appointment form field progression, checkout stepper, and shop grid. Cart and checkout tests use a synthetic purchasable product from `tests/helpers/products.ts`.

## Reconnecting Shopify later

Create the twelve products in the store, then either map by handle (catalog handles are fixed slug-style handles, matching Shopify's handle generation) or fill in each catalog entry's `price` and `variants` with real Shopify variant IDs. The previous `products.json` fetch/normalize code is in git history.
