# Noridoc: tests

Path: @/tests

### Overview

Vitest + React Testing Library suite covering the storefront's behavior: the static catalog and its image manifest, both photo import scripts, the collections gallery and its stack/column layout helpers against the lookbook manifest, the product page, cart/bag interactions, the checkout stepper and permalink construction, the appointment and newsletter forms (including inline validation messages), and the shop grid. Run with `npm test` (or `npm run test:watch`); configuration lives in @/vitest.config.ts (jsdom environment, `@/` alias) and @/vitest.setup.ts.

### How it fits into the larger codebase

Tests exercise the real modules in @/app, @/components, @/lib, and @/scripts. Catalog-facing tests read the real in-repo catalog (@/lib/catalog.ts) and check it against files on disk under @/public/looks; the collections test does the same for @/lib/lookbook.json against @/public/lookbook. Cart and checkout tests use a synthetic purchasable product from @/tests/helpers/products.ts (`makePurchasableProduct`), since no real catalog entry currently has variants or a price. Only true externals are mocked: `next/navigation` (via `vi.mock`, since components render outside a Next router), global `fetch` for Formspree submissions, and `IntersectionObserver` (absent in jsdom).

### Core Implementation

- `catalog.test.ts` asserts the catalog offers the twelve looks in look order with unique handles, that every referenced image path is site-relative and exists under `public/`, that each look has at least two images (the grid hover needs two), and that `getProduct` resolves by handle.
- `import-looks.test.ts` runs the real `importLooks()` from @/scripts/import-looks.mjs against temp JPEGs generated with sharp, verifying resize dimensions, filename-order numbering, never-enlarge behavior, stale-output cleanup, dotfile filtering, and numeric look sorting in the manifest (`Look 10` after `Look 2`).
- `import-lookbook.test.ts` runs the real `importLookbook()` from @/scripts/import-lookbook.mjs against temp JPEG/PNG sources laid out like the photographer's folder (root plus a `BOOKLET SELECTS` subfolder), verifying one output per unique frame number with the largest duplicate winning, fit-inside resizing for both orientations without enlarging, dotfile filtering, stale-output cleanup, a frame-ordered manifest carrying real output dimensions and `group` ids, and the grouping rules themselves: an adjacent visually identical frame shares its predecessor's group, while a visibly different adjacent frame (a half-black composite), a frame-number gap, and an orientation change each start a new group.
- `collections.test.tsx` asserts every `GALLERY_IMAGES` entry exists under `public/` with no repeated `src`, then renders the `/collections` page and checks exactly one visible `img` per `GALLERY_STACKS` entry (each stack's first frame), that clicking a multi-frame tile advances to the next frame, updates the button's accessible name ("frame i of k"), and wraps back to the first, and that single-frame tiles are not buttons.
- `gallery-layout.test.ts` covers `stackImages` (adjacent equal groups merge in order, a stack is sized by its first frame, the real lookbook collapses to fewer than half as many tiles while `flatMap` of the stacks still equals `GALLERY_IMAGES`) and the generic `balanceColumns` over both a synthetic mixed-orientation list and the real `GALLERY_STACKS` (every item placed once, per-column order kept, equal rendered heights, `scale` never above 1 and above a floor).
- Form tests (`appointment`, `newsletter`, `checkout-flow`) drive invalid input through blur and through pressing NEXT / SUBSCRIBE / CONTINUE, asserting the input gains an accessible description (`toHaveAccessibleDescription`) with the exact message and that the mocked `fetch` is not called / the step does not advance.
- `product-page.test.tsx` renders the async server component directly by awaiting `ProductPage({ params: Promise.resolve({ handle }) })`, then partially mocks `@/lib/catalog` (spreading `importOriginal`) to inject one purchasable and one unpriced fixture alongside the real catalog. This covers both panel states: price + `AddToCart` present, and both hidden.
- Component tests render composed trees under a real `CartProvider` (e.g. `Nav` + `BagDrawer` + `AddToCart` together) and drive them with `user-event`, verifying end-to-end flows like "add to cart opens the drawer with name, size, and price" and the four-step checkout gating.
- Pure-function tests (`checkout-url`) assert the exact structure of Shopify cart permalinks, including the `checkout[shipping_address][...]` prefill params.
- @/vitest.setup.ts registers jest-dom matchers, runs `cleanup()` and `localStorage.clear()` after each test, and — critically — installs a spec-faithful in-memory `Storage` on both `window` and `globalThis`.

### Things to Know

- The `MemoryStorage` polyfill exists because Node 25 exposes a broken methodless global `localStorage` (without `--localstorage-file`) that shadows jsdom's implementation under Vitest; without it, @/components/CartContext.tsx would silently fall into its catch-and-return-empty path in tests.
- Because cart state persists in (memory-backed) localStorage, the `afterEach` `localStorage.clear()` is what isolates cart tests from each other.
- `makePurchasableProduct` marks size `S` as unavailable so the disabled-variant path is covered; tests that assert on `TEST JACKET` / `$750` depend on that helper, not on store data.
- Catalog tests depend on real catalog contents (titles of look 1 and 12, the tuxedo jacket's handle, sizes, and detail items). Editing copy in @/lib/catalog.ts or re-importing photos requires updating those assertions.
- Form tests assert on the exact validation copy (e.g. "Enter a valid email address."), so wording lives in one place per validator (@/lib/validation.ts or the `required(...)` call site) and changes there must be mirrored here.
- Both import-script tests exercise sharp for real on generated images in a temp directory, so they depend on the native sharp binary being installed.
- `next/navigation` is mocked per test file with a fixed `usePathname` return, since `Nav` highlights the active link from it; the product page test also mocks `notFound` to throw so the 404 path is observable.
- `next/image` rewrites `src` into an optimizer URL with the path percent-encoded, so `collections.test.tsx` identifies frames through a `file()` helper that decodes the attribute and extracts the 4-digit frame number instead of comparing `src` strings. Hidden frames inside a `GalleryStack` carry `aria-hidden`, which is why `getAllByRole('img')` returns one image per tile rather than one per frame.

Created and maintained by Nori.
