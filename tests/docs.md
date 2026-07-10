# Noridoc: tests

Path: @/tests

### Overview

Vitest + React Testing Library suite covering the storefront's behavior: catalog normalization, cart/bag interactions, the checkout stepper and permalink construction, the appointment form, and the shop grid. Run with `npm test` (or `npm run test:watch`); configuration lives in @/vitest.config.ts (jsdom environment, `@/` alias) and @/vitest.setup.ts.

### How it fits into the larger codebase

Tests exercise the real modules in @/components and @/lib — nothing internal is mocked. Product data comes from the committed real-store fixture @/lib/fixtures/products.json passed through `normalizeProducts`, so tests assert against actual store handles, sizes, and prices (e.g. `white-track-jacket`, sold-out denim sizes). Only true externals are mocked: `next/navigation` (via `vi.mock`, since components render outside a Next router) and global `fetch` for Formspree submissions.

### Core Implementation

- Component tests render composed trees under a real `CartProvider` (e.g. `Nav` + `BagDrawer` + `AddToCart` together) and drive them with `user-event`, verifying end-to-end flows like "add to cart opens the drawer with name, size, and price" and the four-step checkout gating.
- Pure-function tests (`shopify`, `checkout-url`) assert the normalized `Product` shape and the exact structure of Shopify cart permalinks, including the `checkout[shipping_address][...]` prefill params.
- @/vitest.setup.ts registers jest-dom matchers, runs `cleanup()` and `localStorage.clear()` after each test, and — critically — installs a spec-faithful in-memory `Storage` on both `window` and `globalThis`.

### Things to Know

- The `MemoryStorage` polyfill exists because Node 25 exposes a broken methodless global `localStorage` (without `--localstorage-file`) that shadows jsdom's implementation under Vitest; without it, @/components/CartContext.tsx would silently fall into its catch-and-return-empty path in tests.
- Because cart state persists in (memory-backed) localStorage, the `afterEach` `localStorage.clear()` is what isolates cart tests from each other.
- Tests depend on specific fixture contents (handles, prices, availability); updating @/lib/fixtures/products.json to a newer store snapshot requires updating assertions.
- `next/navigation` is mocked per test file with a fixed `usePathname` return, since `Nav` highlights the active link from it.

Created and maintained by Nori.
