# Noridoc: components

Path: @/components

### Overview

All shared UI for the storefront: global chrome (Nav, Footer, BagDrawer), the cart state provider (CartContext), and the page-level interactive pieces (ProductGrid, ProductGallery, AddToCart, CheckoutFlow, AppointmentForm). Each component pairs with a CSS Module of the same name.

### How it fits into the larger codebase

@/app/layout.tsx mounts `CartProvider`, `Nav`, `Footer`, and `BagDrawer` around every page; the remaining components are rendered by individual routes in @/app. Components consume the `Product`/`ProductVariant` types and `formatPrice` from @/lib, and `CheckoutFlow` calls `buildCheckoutUrl` from @/lib/checkout.ts to hand off to Shopify's hosted checkout. Each component follows a named external design reference: Nav (The Row), BagDrawer and ProductGallery (YSL), ProductGrid and CheckoutFlow (Rick Owens), AppointmentForm (Phoebe Philo), Footer (Emily Dawn Long).

### Core Implementation

**Cart state** (@/components/CartContext.tsx) is the centerpiece. `localStorage` (key `haitch-bag`) is the source of truth, wrapped as an external store consumed via `useSyncExternalStore`:

```
server render ──▶ getServerSnapshot() = []          (empty bag)
hydration     ──▶ getSnapshot() reads localStorage  (real bag appears)
mutations     ──▶ writeLines() → localStorage + notify listeners
```

`getSnapshot` caches the parsed lines keyed on the raw string so React receives a stable reference between renders. If storage writes fail (private mode, quota), `writeLines` falls back to updating the in-memory cache so the bag still works for the session. `BagLine` denormalizes product data (title, size, price, image) at add-time keyed by `variantId`; `add()` also opens the drawer. Drawer open/close is plain `useState`, not persisted.

**Other components:**
- `Nav` — client component; scroll-aware header styling, active-link highlighting via `usePathname`, mobile full-screen menu, and the `BAG (n)` button that opens the drawer.
- `BagDrawer` — slide-in dialog rendering bag lines with quantity controls, linking to `/checkout`. Returns `null` when closed.
- `AddToCart` — size `<select>` that disables sold-out variants (labels them `— SOLD OUT`), defaults to the first available size, and disables the button entirely when nothing is available.
- `ProductGrid` — server component; borderless tile grid where each tile stacks the first two product images for a CSS hover swap.
- `ProductGallery` — vertical scroll gallery with an `IntersectionObserver` (threshold 0.55) driving the `current / total` image counter.
- `CheckoutFlow` — Rick Owens-style stepper (BAG → INFORMATION → SHIPPING → PAYMENT). Steps gate on validation (`informationValid` requires email regex + names; `shippingValid` requires address1/city/zip); the final step is an `<a>` whose href is the `buildCheckoutUrl` permalink. Renders an empty-bag state when there are no lines.
- `AppointmentForm` — one-field-at-a-time form (name → email → phone → message) with per-field validation and Enter-to-advance; submits JSON to `https://formspree.io/f/{NEXT_PUBLIC_FORMSPREE_ID}` and tracks `idle | sending | sent | error` status.

### Things to Know

- `useCart()` throws if used outside `CartProvider`, so every cart-touching component must render under the root layout (tests wrap manually in `CartProvider`).
- Quantity controls implement removal implicitly: `setQuantity` with a value below 1 filters the line out.
- Cart mutation closures capture `lines` from the current snapshot inside `useMemo`, so all mutations derive from the latest storage-backed state rather than component-local state.
- The checkout total shown in `CheckoutFlow` and `BagDrawer` is the subtotal only; shipping (and tax) are "CALCULATED AT CHECKOUT" on Shopify's side.
- `AddToCart`'s `madeToOrder` note is not here — it lives in the product page (@/app/products/[handle]/page.tsx), keyed off the product description text.

Created and maintained by Nori.
