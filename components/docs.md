# Noridoc: components

Path: @/components

### Overview

All shared UI for the storefront: global chrome (Nav, Footer, BagDrawer, NewsletterModal), the cart state provider (CartContext), the page-level interactive pieces (ProductGrid, ProductGallery, AddToCart, SizeGuide, CheckoutFlow, AppointmentForm), and the small `FieldError` primitive every form uses for inline validation messages. Each component pairs with a CSS Module of the same name.

### How it fits into the larger codebase

@/app/layout.tsx mounts `CartProvider`, `Nav`, `Footer`, and `BagDrawer` around every page; the remaining components are rendered by individual routes in @/app. Components consume the `Product`/`ProductVariant` types from @/lib/product.ts and `formatPrice` from @/lib/format.ts, and `CheckoutFlow` calls `buildCheckoutUrl` from @/lib/checkout.ts to hand off to Shopify's hosted checkout. The three forms (`AppointmentForm`, `NewsletterModal`, `CheckoutFlow`) share the `Validator` functions in @/lib/validation.ts and render their messages through `FieldError`; `NewsletterModal` also reads `GALLERY_IMAGES` from @/lib/gallery.ts for its picture. Each component follows a named external design reference: Nav (The Row), BagDrawer and ProductGallery (YSL), ProductGrid and CheckoutFlow (Rick Owens), AppointmentForm (Phoebe Philo), Footer (Emily Dawn Long).

### Core Implementation

**Cart state** (@/components/CartContext.tsx) is the centerpiece. `localStorage` (key `haitch-bag`) is the source of truth, wrapped as an external store consumed via `useSyncExternalStore`:

```
server render ──▶ getServerSnapshot() = []          (empty bag)
hydration     ──▶ getSnapshot() reads localStorage  (real bag appears)
mutations     ──▶ writeLines() → localStorage + notify listeners
```

`getSnapshot` caches the parsed lines keyed on the raw string so React receives a stable reference between renders. If storage writes fail (private mode, quota), `writeLines` falls back to updating the in-memory cache so the bag still works for the session. `BagLine` denormalizes product data (title, size, price, image) at add-time keyed by `variantId`; `add()` also opens the drawer. Drawer open/close is plain `useState`, not persisted.

**Inline form validation** is one pattern applied to all three forms. A `Validator` (@/lib/validation.ts) returns a message string or `null`; a field's message is only *shown* once the field is touched (blur) or the user has attempted to advance/submit, but advancing/submitting is blocked whenever any field in the current step still returns a message:

```
value ──▶ validator ──▶ error | null
                          │
   touched || attempted ──┴──▶ shownError ──▶ <FieldError id role="alert"> under the field
                                          └──▶ input aria-invalid + aria-describedby={id}
```

Buttons are not disabled for invalid input (only while a request is in flight), so pressing NEXT / CONTINUE / SUBSCRIBE is what surfaces the messages. Forms set `noValidate` so the browser's native bubble does not compete with `FieldError`. `FieldError` (@/components/FieldError.tsx) renders nothing when the message is `null`; otherwise a `<p id role="alert">` in 10px tracked type, the forms' existing deep red, with a short fade-in.

**Other components:**
- `Nav` — client component; scroll-aware header styling, active-link highlighting via `usePathname`, mobile full-screen menu behind an icon-only hamburger toggle (two hairlines that fold into an X, labelled "Open menu"/"Close menu" for screen readers), and the `BAG (n)` button that opens the drawer.
- `BagDrawer` — slide-in dialog rendering bag lines with quantity controls, linking to `/checkout`. Returns `null` when closed.
- `AddToCart` — size `<select>` that disables sold-out variants (labels them `— SOLD OUT`), defaults to the first available size, and disables the button entirely when nothing is available. The product page only mounts it when the product has variants.
- `ProductGrid` — server component; borderless tile grid where each tile stacks the first two product images for a CSS hover swap. The price span renders only when `p.price` is defined. The first four tiles use `loading="eager"`, the rest lazy-load.
- `ProductGallery` — vertical scroll gallery with an `IntersectionObserver` (threshold 0.55) driving the `current / total` image counter. Slides declare an intrinsic 2000×2500 (4:5) size matching the committed look photos, and the first slide sets `preload`.
- `CheckoutFlow` — Rick Owens-style stepper (BAG → INFORMATION → SHIPPING → PAYMENT). A module-level `VALIDATORS` map keyed by `CheckoutInfo` field and a `STEP_FIELDS` list per step drive validation: email, first/last name, address, city, state (`province`), and zip are required; phone and apt/suite are optional (phone validates format only when filled). An `attempted` flag per step (reset by `goTo` on any navigation) plus per-field `touched` decide which messages show; the `field(key, id)` helper builds each input's value/change/blur/aria props and pairs it with a `FieldError` at `${id}-error`. The final step is an `<a>` whose href is the `buildCheckoutUrl` permalink. Renders an empty-bag state when there are no lines.
- `AppointmentForm` — one-field-at-a-time form (name → email → phone → message), each entry in `FIELDS` carrying its own validator. A single `touched` flag governs the visible field and resets on every step change; Enter and NEXT both call `advance`, which marks touched and only moves on when the field passes. `submit` re-validates all four values before POSTing JSON to `https://formspree.io/f/{NEXT_PUBLIC_FORMSPREE_ID}` and tracks `idle | sending | sent | error` status.
- `NewsletterModal` — footer trigger opening a portalled dialog (Escape closes, focus returns to the opener) with the first portrait lookbook frame from `GALLERY_IMAGES` as its picture. Name is required and email is validated; per-field `touched` plus a `submitted` flag control message display, and the POST (tagged `form: 'newsletter'`) only fires when both pass.

### Things to Know

- `useCart()` throws if used outside `CartProvider`, so every cart-touching component must render under the root layout (tests wrap manually in `CartProvider`).
- Quantity controls implement removal implicitly: `setQuantity` with a value below 1 filters the line out.
- Cart mutation closures capture `lines` from the current snapshot inside `useMemo`, so all mutations derive from the latest storage-backed state rather than component-local state.
- The checkout total shown in `CheckoutFlow` and `BagDrawer` is the subtotal only; shipping (and tax) are "CALCULATED AT CHECKOUT" on Shopify's side.
- STATE is a required checkout field; it feeds the `checkout[shipping_address][province]` prefill in the permalink. Phone is optional but, when entered, must contain at least seven digits.
- Validation message copy lives next to the validators (`required('Enter your full name.')`, `'Enter a valid email address.'`, `'Enter a valid phone number.'`, `'Enter your zip code.'`, etc.); tests assert on it via `toHaveAccessibleDescription`, so wording changes require updating @/tests.
- `ProductGrid` and `ProductGallery` pass site-relative `/looks/...` paths to `next/image`, so they go through Next's built-in optimizer; `BagDrawer`/`CheckoutFlow` may render legacy `cdn.shopify.com` images from bag lines persisted before the catalog switch, which is why that host remains allowlisted in @/next.config.ts.
- The cart and checkout code paths are fully exercised by tests with a synthetic purchasable product, but no product in the live catalog currently has variants, so they are unreachable from the UI until Shopify variants are supplied.

Created and maintained by Nori.
