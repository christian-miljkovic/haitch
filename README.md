# HAITCH

Redesigned storefront for [haitch-usa.com](https://haitch-usa.com) — a NYC menswear label. Next.js 16 App Router, TypeScript, CSS Modules.

## How it works

- **Catalog** — fetched live from the existing Shopify store's public `products.json` (revalidated every 10 minutes), normalized in `lib/shopify.ts`. A recorded fixture (`lib/fixtures/products.json`) keeps the site rendering if the fetch fails.
- **Bag** — client-side cart in `localStorage` (`components/CartContext.tsx`), YSL-style slide-in drawer.
- **Checkout** — custom Bag → Information → Shipping steps (`/checkout`), then a hand-off to Shopify's hosted checkout via a cart permalink with contact/address prefilled. Shop Pay / shop.app, Apple Pay, Google Pay and cards all appear there automatically. (Shopify does not allow custom payment pages — the hosted checkout is where Shop Pay lives.)
- **Appointments** — `/appointment` posts to Formspree.
- **Images** — served straight from the Shopify CDN through a custom `next/image` loader that uses Shopify's native `?width=` resizing.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest + React Testing Library
npm run lint
npm run build
```

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FORMSPREE_ID` | Formspree form ID for the appointment form (create one at formspree.io) |

Without it the appointment form still renders but submissions will fail.

## Deploying to Vercel

Zero-config: import the repo in Vercel, set `NEXT_PUBLIC_FORMSPREE_ID`, deploy. No `vercel.json` needed.

## Tests

Behavior tests live in `tests/` — catalog normalization against the recorded Shopify response, checkout permalink construction, bag behavior (add/quantity/remove/persistence), bag drawer, appointment form field progression, checkout stepper, and shop grid.
