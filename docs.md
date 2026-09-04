# Noridoc: haitch

Path: @/

### Overview

A redesigned storefront for HAITCH (haitch-usa.com), a NYC menswear label. Next.js App Router (v16) with TypeScript strict mode, CSS Modules, and npm; deployed to Vercel with zero config. There is no database and no Shopify API credentials. The product catalog is a static, in-repo line sheet (@/lib/catalog.ts) with studio photography committed under @/public/looks; the Shopify store is only used for hosted checkout and for legacy editorial imagery.

### How it fits into the larger codebase

This repo is the entire project. Its external touchpoints are:

```
   in-repo catalog                     ┌──────────────────────────────┐
   lib/catalog.ts + public/looks       │  haitch-usa.com (Shopify)    │   hosted checkout
   (no runtime fetch)                  │  - /cart/{variant}:{qty}     │◀── cart permalink
                                       │  - cdn/shop editorial images │    handoff
                                       └──────────────────────────────┘
                                       ┌──────────────────────────────┐
   appointment / newsletter ──────────▶│  formspree.io                │
   form POST                           └──────────────────────────────┘
```

- Catalog data is hand-transcribed from the brand's "Website 2.0 Outline" line sheet into @/lib/catalog.ts, one entry per photographed "Look". Images are local files under @/public/looks, listed in the generated manifest @/lib/looks.json. Nothing about the catalog is fetched at build or request time, so `/shop` and `/products/[handle]` are fully static.
- Payment happens on Shopify's hosted checkout; @/lib/checkout.ts builds cart permalink URLs (`STORE_URL` from @/lib/shopify.ts) that prefill contact/shipping fields. A fully custom payment page is impossible under Shopify policy, so the custom @/app/checkout page collects Bag → Information → Shipping and then hands off.
- Images split by origin: local look photos go through Next's built-in image optimizer; the landing hero, collections gallery, and newsletter image still live on the Shopify CDN and are allowlisted via `images.remotePatterns` in @/next.config.ts. Only the hero uses an explicit per-instance loader (@/lib/shopify-image.ts).
- @/scripts/import-looks.mjs (`npm run import:looks -- <sourceDir>`) is the offline pipeline that turns the photographer's high-res `Look N/` folders into the committed web-sized JPEGs and the manifest.

### Core Implementation

| Layer | Location | Role |
|---|---|---|
| Routes | @/app | Pages, layouts, metadata |
| UI | @/components | Client/server components incl. cart state (`CartContext`) |
| Data & utilities | @/lib | Static catalog + `Product` types, checkout URLs, price format, curated gallery URLs, hero image loader |
| Asset pipeline | @/scripts | `import-looks.mjs` resizes source photography into @/public/looks and writes @/lib/looks.json |
| Tests | @/tests | Vitest + React Testing Library, configured by @/vitest.config.ts and @/vitest.setup.ts |

Cart ("bag") state lives in `localStorage` under the key `haitch-bag`, exposed to React via `useSyncExternalStore` in @/components/CartContext.tsx — the server always renders an empty bag and the real contents appear right after hydration, avoiding SSR mismatch.

Design references per surface: The Row (nav), Rick Owens (shop grid, checkout stepper), YSL (product page, bag drawer), Phoebe Philo (appointment form), Emily Dawn Long (footer).

### Things to Know

- @/AGENTS.md (aliased by @/CLAUDE.md) warns that this Next.js version differs from training data and points to guides under `node_modules/next/dist/docs/`.
- The only environment variable is `NEXT_PUBLIC_FORMSPREE_ID` (appointment form target); it defaults to `'placeholder'` when unset.
- Node 25 ships a broken methodless global `localStorage` that shadows jsdom's under Vitest; @/vitest.setup.ts installs an in-memory `Storage` polyfill so cart tests exercise the real Storage API.
- The `@/` import alias maps to the repo root in both @/tsconfig.json and @/vitest.config.ts.
- Cart/checkout is intentionally non-functional for the new looks: every catalog entry has `variants: []` and no `price`, so the product page renders neither a price nor `AddToCart`. The line sheet listed prices as "$X", which is why prices are deliberately absent rather than guessed.
- Reconnecting to Shopify later requires creating the twelve products in the store and then either mapping by handle (catalog handles are fixed slug-style handles, chosen to match how Shopify generates handles) or supplying variant IDs into each entry's `variants`. The old `products.json` fetch/normalize code and its fixture were deleted but are recoverable from git history.
- `cdn.shopify.com` stays in `remotePatterns` because bag lines persisted in visitors' `localStorage` may still reference legacy Shopify product images.

Created and maintained by Nori.
