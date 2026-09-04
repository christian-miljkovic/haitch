# Noridoc: tests

Path: @/tests

### Overview

Vitest + React Testing Library suite covering the storefront's behavior: the static catalog and its image manifest, the photo import script, the product page, cart/bag interactions, the checkout stepper and permalink construction, the appointment and newsletter forms, and the shop grid. Run with `npm test` (or `npm run test:watch`); configuration lives in @/vitest.config.ts (jsdom environment, `@/` alias) and @/vitest.setup.ts.

### How it fits into the larger codebase

Tests exercise the real modules in @/app, @/components, @/lib, and @/scripts. Catalog-facing tests read the real in-repo catalog (@/lib/catalog.ts) and check it against files on disk under @/public/looks. Cart and checkout tests use a synthetic purchasable product from @/tests/helpers/products.ts (`makePurchasableProduct`), since no real catalog entry currently has variants or a price. Only true externals are mocked: `next/navigation` (via `vi.mock`, since components render outside a Next router), global `fetch` for Formspree submissions, and `IntersectionObserver` (absent in jsdom).

### Core Implementation

- `catalog.test.ts` asserts the catalog offers the twelve looks in look order with unique handles, that every referenced image path is site-relative and exists under `public/`, that each look has at least two images (the grid hover needs two), and that `getProduct` resolves by handle.
- `import-looks.test.ts` runs the real `importLooks()` from @/scripts/import-looks.mjs against temp JPEGs generated with sharp, verifying resize dimensions, filename-order numbering, never-enlarge behavior, stale-output cleanup, dotfile filtering, and numeric look sorting in the manifest (`Look 10` after `Look 2`).
- `product-page.test.tsx` renders the async server component directly by awaiting `ProductPage({ params: Promise.resolve({ handle }) })`, then partially mocks `@/lib/catalog` (spreading `importOriginal`) to inject one purchasable and one unpriced fixture alongside the real catalog. This covers both panel states: price + `AddToCart` present, and both hidden.
- Component tests render composed trees under a real `CartProvider` (e.g. `Nav` + `BagDrawer` + `AddToCart` together) and drive them with `user-event`, verifying end-to-end flows like "add to cart opens the drawer with name, size, and price" and the four-step checkout gating.
- Pure-function tests (`checkout-url`) assert the exact structure of Shopify cart permalinks, including the `checkout[shipping_address][...]` prefill params.
- @/vitest.setup.ts registers jest-dom matchers, runs `cleanup()` and `localStorage.clear()` after each test, and — critically — installs a spec-faithful in-memory `Storage` on both `window` and `globalThis`.

### Things to Know

- The `MemoryStorage` polyfill exists because Node 25 exposes a broken methodless global `localStorage` (without `--localstorage-file`) that shadows jsdom's implementation under Vitest; without it, @/components/CartContext.tsx would silently fall into its catch-and-return-empty path in tests.
- Because cart state persists in (memory-backed) localStorage, the `afterEach` `localStorage.clear()` is what isolates cart tests from each other.
- `makePurchasableProduct` marks size `S` as unavailable so the disabled-variant path is covered; tests that assert on `TEST JACKET` / `$750` depend on that helper, not on store data.
- Catalog tests depend on real catalog contents (titles of look 1 and 12, the tuxedo jacket's handle, sizes, and detail items). Editing copy in @/lib/catalog.ts or re-importing photos requires updating those assertions.
- `next/navigation` is mocked per test file with a fixed `usePathname` return, since `Nav` highlights the active link from it; the product page test also mocks `notFound` to throw so the 404 path is observable.

Created and maintained by Nori.
