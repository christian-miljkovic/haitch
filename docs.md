# Noridoc: haitch

Path: @/

### Overview

A redesigned storefront for HAITCH (haitch-usa.com), a NYC menswear label. Next.js App Router (v16) with TypeScript strict mode, CSS Modules, and npm; deployed to Vercel with zero config. There is no database and no Shopify API credentials. The product catalog is a static, in-repo line sheet (@/lib/catalog.ts) with studio photography committed under @/public/looks, and the `/collections` gallery is the photographer's LOOKBOOK shoot committed under @/public/lookbook; the Shopify store is only used for hosted checkout and for the landing hero image.

### How it fits into the larger codebase

This repo is the entire project. Its external touchpoints are:

```
   in-repo catalog + lookbook          ┌──────────────────────────────┐
   lib/catalog.ts + public/looks       │  haitch-usa.com (Shopify)    │   hosted checkout
   lib/lookbook.json + public/lookbook │  - /cart/{variant}:{qty}     │◀── cart permalink
   (no runtime fetch)                  │  - cdn/shop hero image       │    handoff
                                       └──────────────────────────────┘
                                       ┌──────────────────────────────┐
   appointment / newsletter ──────────▶│  formspree.io                │
   form POST                           └──────────────────────────────┘
```

- Catalog data is hand-transcribed from the brand's "Website 2.0 Outline" line sheet into @/lib/catalog.ts, one entry per photographed "Look". Images are local files under @/public/looks, listed in the generated manifest @/lib/looks.json. Nothing about the catalog is fetched at build or request time, so `/shop` and `/products/[handle]` are fully static.
- Payment happens on Shopify's hosted checkout; @/lib/checkout.ts builds cart permalink URLs (`STORE_URL` from @/lib/shopify.ts) that prefill contact/shipping fields. A fully custom payment page is impossible under Shopify policy, so the custom @/app/checkout page collects Bag → Information → Shipping and then hands off.
- Images split by origin: local look photos (@/public/looks) and the lookbook gallery / newsletter image (@/public/lookbook) go through Next's built-in image optimizer; only the landing hero still lives on the Shopify CDN, allowlisted via `images.remotePatterns` in @/next.config.ts and loaded through the explicit per-instance loader (@/lib/shopify-image.ts).
- Two offline asset pipelines in @/scripts commit web-sized JPEGs plus a JSON manifest that the app reads at build time: `import-looks.mjs` (`npm run import:looks -- <sourceDir>`) turns the `Look N/` product folders into @/public/looks + @/lib/looks.json, and `import-lookbook.mjs` (`npm run import:lookbook -- <folder>`) turns the LOOKBOOK shoot into @/public/lookbook + @/lib/lookbook.json (one image per unique frame number, with recorded width/height).
- Every form (appointment, newsletter, checkout information/shipping) validates inline with the shared validators in @/lib/validation.ts and the @/components/FieldError.tsx message component, so field-level error copy and accessibility wiring are uniform across surfaces.

### Core Implementation

| Layer | Location | Role |
|---|---|---|
| Routes | @/app | Pages, layouts, metadata |
| UI | @/components | Client/server components incl. cart state (`CartContext`) |
| Data & utilities | @/lib | Static catalog + `Product` types, checkout URLs, price format, hero URLs + lookbook gallery manifest, hero image loader, form field validators |
| Asset pipeline | @/scripts | `import-looks.mjs` (product looks → @/public/looks + @/lib/looks.json) and `import-lookbook.mjs` (LOOKBOOK shoot → @/public/lookbook + @/lib/lookbook.json) |
| Tests | @/tests | Vitest + React Testing Library, configured by @/vitest.config.ts and @/vitest.setup.ts |

Cart ("bag") state lives in `localStorage` under the key `haitch-bag`, exposed to React via `useSyncExternalStore` in @/components/CartContext.tsx — the server always renders an empty bag and the real contents appear right after hydration, avoiding SSR mismatch.

Design references per surface: The Row (nav), Rick Owens (shop grid, checkout stepper), YSL (product page, bag drawer), Phoebe Philo (appointment form), Emily Dawn Long (footer).

### Things to Know

- @/AGENTS.md (aliased by @/CLAUDE.md) warns that this Next.js version differs from training data and points to guides under `node_modules/next/dist/docs/`.
- The only environment variable is `NEXT_PUBLIC_FORMSPREE_ID` (target for the appointment and newsletter forms); it defaults to `'placeholder'` when unset.
- Node 25 ships a broken methodless global `localStorage` that shadows jsdom's under Vitest; @/vitest.setup.ts installs an in-memory `Storage` polyfill so cart tests exercise the real Storage API.
- The `@/` import alias maps to the repo root in both @/tsconfig.json and @/vitest.config.ts.
- Cart/checkout is intentionally non-functional for the new looks: every catalog entry has `variants: []` and no `price`, so the product page renders neither a price nor `AddToCart`. The line sheet listed prices as "$X", which is why prices are deliberately absent rather than guessed.
- Reconnecting to Shopify later requires creating the twelve products in the store and then either mapping by handle (catalog handles are fixed slug-style handles, chosen to match how Shopify generates handles) or supplying variant IDs into each entry's `variants`. The old `products.json` fetch/normalize code and its fixture were deleted but are recoverable from git history.
- `cdn.shopify.com` stays in `remotePatterns` because bag lines persisted in visitors' `localStorage` may still reference legacy Shopify product images. The collections gallery no longer touches the Shopify CDN at all.
- Generated manifests (@/lib/looks.json, @/lib/lookbook.json) and their image folders must be committed together: tests assert every manifest path exists on disk.

Created and maintained by Nori.
