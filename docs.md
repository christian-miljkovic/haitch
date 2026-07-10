# Noridoc: haitch

Path: @/

### Overview

A redesigned storefront for HAITCH (haitch-usa.com), a NYC menswear label. Next.js App Router (v16) with TypeScript strict mode, CSS Modules, and npm; deployed to Vercel with zero config. The site is a read-only frontend over the label's existing Shopify store — there is no database and no Shopify API credentials.

### How it fits into the larger codebase

This repo is the entire project. Its two external touchpoints are:

```
                    ┌──────────────────────────────┐
   reads catalog    │  haitch-usa.com (Shopify)    │   hosted checkout
  products.json ───▶│  - /products.json (public)   │◀── cart permalink
                    │  - /cart/{variant}:{qty}     │    handoff
                    │  - cdn/shop images           │
                    └──────────────────────────────┘
                    ┌──────────────────────────────┐
  appointment ─────▶│  formspree.io                │
  form POST         └──────────────────────────────┘
```

- Catalog data comes from the store's public `products.json` endpoint via @/lib/shopify.ts (ISR, 600s revalidate), with a committed fixture fallback at @/lib/fixtures/products.json.
- Payment happens on Shopify's hosted checkout; @/lib/checkout.ts builds cart permalink URLs that prefill contact/shipping fields. A fully custom payment page is impossible under Shopify policy, so the custom @/app/checkout page collects Bag → Information → Shipping and then hands off.
- All images are served from the Shopify CDN through a custom `next/image` loader (@/lib/image-loader.ts, wired in @/next.config.ts) that appends `?width=` for native CDN resizing.

### Core Implementation

| Layer | Location | Role |
|---|---|---|
| Routes | @/app | Pages, layouts, metadata, ISR config |
| UI | @/components | Client/server components incl. cart state (`CartContext`) |
| Data & utilities | @/lib | Shopify fetch/normalize, checkout URLs, price format, curated gallery URLs, image loader |
| Tests | @/tests | Vitest + React Testing Library, configured by @/vitest.config.ts and @/vitest.setup.ts |

Cart ("bag") state lives in `localStorage` under the key `haitch-bag`, exposed to React via `useSyncExternalStore` in @/components/CartContext.tsx — the server always renders an empty bag and the real contents appear right after hydration, avoiding SSR mismatch.

Design references per surface: The Row (nav), Rick Owens (shop grid, checkout stepper), YSL (product page, bag drawer), Phoebe Philo (appointment form), Emily Dawn Long (footer).

### Things to Know

- @/AGENTS.md (aliased by @/CLAUDE.md) warns that this Next.js version differs from training data and points to guides under `node_modules/next/dist/docs/`.
- The only environment variable is `NEXT_PUBLIC_FORMSPREE_ID` (appointment form target); it defaults to `'placeholder'` when unset.
- Node 25 ships a broken methodless global `localStorage` that shadows jsdom's under Vitest; @/vitest.setup.ts installs an in-memory `Storage` polyfill so cart tests exercise the real Storage API.
- The `@/` import alias maps to the repo root in both @/tsconfig.json and @/vitest.config.ts.
- If the live `products.json` fetch fails for any reason, the site silently serves the committed fixture — the build never breaks on store downtime.

Created and maintained by Nori.
