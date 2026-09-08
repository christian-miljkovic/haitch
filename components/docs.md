# Noridoc: components

Path: @/components

### Overview

All shared UI for the storefront: global chrome (Nav, Footer, BagDrawer, NewsletterModal), the cart state provider (CartContext), the page-level interactive pieces (ProductGrid, ProductGallery, the collections gallery — the season switcher SeasonTabs plus the trio GalleryGrid/GalleryStack/GalleryViewer — AddToCart, SizeGuide, CheckoutFlow, AppointmentForm), and the small `FieldError` primitive every form uses for inline validation messages. Each component pairs with a CSS Module of the same name.

### How it fits into the larger codebase

@/app/layout.tsx mounts `CartProvider`, `Nav`, `Footer`, and `BagDrawer` around every page; the remaining components are rendered by individual routes in @/app. Components consume the `Product`/`ProductVariant` types from @/lib/product.ts and `formatPrice` from @/lib/format.ts. `CheckoutFlow` types its form state as `CheckoutInfo` from @/lib/checkout.ts and, at the PAYMENT step, POSTs the bag and that info to the route handler @/app/api/checkout/route.ts, then navigates the browser to the Shopify-hosted payment URL the route returns — the component never talks to Shopify itself and never sees credentials. The three forms (`AppointmentForm`, `NewsletterModal`, `CheckoutFlow`) share the `Validator` functions in @/lib/validation.ts and render their messages through `FieldError`; `NewsletterModal` also reads `NEWSLETTER_IMAGE` (a `Photo` resolved from the current shoot's manifest, not from any archived season) from @/lib/gallery.ts for its picture, and `GalleryGrid` receives the balanced `Placed<GalleryStack>[][]` columns (from `balanceColumns` in @/lib/gallery-layout.ts) from @/app/collections/page.tsx and @/app/collections/[season]/page.tsx, handing each stack's `GalleryImage[]` to a `GalleryStack` tile and the open stack's frames to `GalleryViewer`; `SeasonTabs`, mounted above the grid by both routes, reads `SEASONS` from @/lib/gallery.ts and is told which slug is active. Each component follows a named external design reference: Nav (The Row), BagDrawer and ProductGallery (YSL), ProductGrid and CheckoutFlow (Rick Owens), AppointmentForm (Phoebe Philo), Footer (Emily Dawn Long).

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

**Checkout hand-off** is the one place a component performs a request other than Formspree:

```
PAYMENT step ── PROCEED TO PAYMENT ──▶ startPayment()
   payment: 'idle' ──▶ 'starting' (button disabled, label "STARTING YOUR ORDER…")
        POST /api/checkout { lines: [{ variantId, quantity }], info: CheckoutInfo }
        ok + body.url  ──▶ window.location.assign(url)      (leaves the site for Shopify's invoice page)
        !ok or no url  ──▶ payment: 'error' ──▶ <p role="alert"> "We could not start your order…"; button re-enabled
```

**Collections gallery** is a server-rendered season switcher plus three client components under one state owner. Both routes render the same pair for a different `Season`:

```
app/collections/page.tsx            (season = SEASONS[0])      ┐
app/collections/[season]/page.tsx   (season = archived match)  ┘── SeasonTabs active={season.slug}   (server; Links over SEASONS)
                                                                └── balanceColumns(season.stacks, GALLERY_COLUMNS) ──▶ GalleryGrid
                                                                            open: { tile, frame } | null
                                              ┌─────────────────────────────────┴──────────────────┐
                                              ▼                                                    ▼
                                   GalleryStack (one per tile)                       GalleryViewer (portal, only while open)
                                   local: current frame, revealed                    frame is controlled: frame / onFrameChange
                                   onOpen(frame) ──▶ setOpen({ tile: index, frame })  onClose ──▶ setOpen(null)
```

- `SeasonTabs` — server component (@/components/SeasonTabs.tsx): a `<nav aria-label="Seasons">` sitting top-left above the gallery with one `next/link` per entry in `SEASONS` (label text such as "SEASON 2", `href` from the season), 11px uppercase tracked type in `var(--muted)`. The link whose `slug` matches the `active` prop gets the `.active` class and `aria-current="page"`; active and hovered tabs turn `var(--fg)` and reveal the same hairline `::after` underline animation the nav uses (scaleX from the right, back in from the left). Padding is 22px/18px vertical, 16px/14px on phones. It has no state of its own — the routes decide which slug is active.
- `GalleryGrid` — renders the balanced columns (`.gallery` flex → `.column` → `.item` wrappers carrying `order`, `--ratio`, `--scale`; on ≤767px `.column` becomes `display: contents` so tiles re-sort into shoot order at full width) and holds the only cross-tile state, `open`. It resolves `open.tile` back to a stack by flattening the columns and sorting on `Placed.index`, so the tile number is always the source stack index, the same number `GalleryStack` uses for `position` and labels.
- `GalleryStack` — one tile. Props are the stack's `images`, its `position`, and `onOpen(frame)`. Every frame is an absolutely positioned `next/image` filling the tile (`object-fit: cover`, real `width`/`height` from the manifest); only the frame at `current` is visible (0.6s opacity crossfade) and the others carry `aria-hidden`. The tile is always a `<button class=tile>`: a lone frame is labelled "Lookbook image N. View full screen" and calls `onOpen(0)`; a multi-frame stack is labelled "Lookbook image N, frame i of k. Show next frame" and advances/wraps `current` in place. Multi-frame tiles additionally render an "i — k" counter (bottom-left, 10px tracked type, `mix-blend-mode: difference`, `pointer-events: none`) and a sibling `<button class=expand>` — a hairline 12px square bottom-right, labelled "View lookbook image N full screen" — that calls `onOpen(current)`. The two buttons are siblings inside the wrapper `<div>`, never nested. Only the first frame of the first three tiles is `loading="eager"`.
- `GalleryViewer` — full-screen (a translucent off-white veil, `rgba(250,250,248,0.88)` + `backdrop-filter: blur(24px)`, over the gallery rather than an opaque panel) `role="dialog" aria-modal` portalled into `document.body` (`var(--bg)` background, z-index 60, short fade-in), labelled "Lookbook image N" plus ", frame i of k" for stacks. The current frame is a `next/image` with `object-fit: contain` and `priority`. On mount it focuses the "✕" close button (top-right) and sets `document.body.style.overflow = 'hidden'`; on unmount it restores the previous overflow and refocuses the element that was active before opening. Multi-frame stacks get "‹"/"›" side buttons ("Previous frame"/"Next frame", hidden on ≤767px) and a muted 10px "i — k" counter bottom-left with visually-hidden "Frame … of" text. ArrowLeft/ArrowRight step with wrap-around, Escape closes, and clicking the stage advances (or closes when there is a single frame). It never owns the frame index: `step` calls `onFrameChange`, and `GalleryGrid` writes the new `frame` into `open`.

**Other components:**
- `Nav` — client component; scroll-aware header styling, active-link highlighting via `usePathname`, mobile full-screen menu behind an icon-only hamburger toggle (two hairlines that fold into an X, labelled "Open menu"/"Close menu" for screen readers), and the `BAG (n)` button that opens the drawer.
- `BagDrawer` — slide-in dialog rendering bag lines with quantity controls, linking to `/checkout`. Returns `null` when closed.
- `AddToCart` — size `<select>` that disables sold-out variants (labels them `— SOLD OUT`), defaults to the first available size, and disables the button entirely when nothing is available. The product page only mounts it when the product has variants, which means the look matched a product in @/lib/shopify-products.json — true for all twelve committed looks. The `<option>` order is the line-sheet size run, applied by @/lib/catalog.ts through `orderVariants`, not the store's order.
- `ProductGrid` — server component; borderless tile grid where each tile stacks the first two product images for a CSS hover swap. The price span renders only when `p.price` is defined, which for the committed catalog is every product (prices come from the line sheet or, for matched looks, the first store variant via @/lib/catalog.ts). The first four tiles use `loading="eager"`, the rest lazy-load.
- `ProductGallery` — vertical scroll gallery with an `IntersectionObserver` (threshold 0.55) driving the `current / total` image counter. Slides declare an intrinsic 2000×2500 (4:5) size matching the committed look photos, and the first slide sets `preload`.
- `CheckoutFlow` — Rick Owens-style stepper (BAG → INFORMATION → SHIPPING → PAYMENT). A module-level `VALIDATORS` map keyed by `CheckoutInfo` field and a `STEP_FIELDS` list per step drive validation: email, first/last name, address, city, state (`province`), and zip are required; phone and apt/suite are optional (phone validates format only when filled). An `attempted` flag per step (reset by `goTo` on any navigation) plus per-field `touched` decide which messages show; the `field(key, id)` helper builds each input's value/change/blur/aria props and pairs it with a `FieldError` at `${id}-error`. The PAYMENT step is a PROCEED TO PAYMENT `<button>` driven by a `payment` state (`idle | starting | error`, described above); the bag's lines are sent as `{ variantId, quantity }` and the whole `info` object goes along for Shopify's email and shipping address. Renders an empty-bag state when there are no lines.
- `AppointmentForm` — one-field-at-a-time form (name → email → phone → message), each entry in `FIELDS` carrying its own validator. A single `touched` flag governs the visible field and resets on every step change; Enter and NEXT both call `advance`, which marks touched and only moves on when the field passes. `submit` re-validates all four values before POSTing JSON to `https://formspree.io/f/{NEXT_PUBLIC_FORMSPREE_ID}` and tracks `idle | sending | sent | error` status.
- `NewsletterModal` — footer trigger opening a portalled dialog (Escape closes, focus returns to the opener) with `NEWSLETTER_IMAGE.src` from @/lib/gallery.ts as its picture (the deck's chosen lookbook frame, resolved with fallbacks in lib so the component never picks a frame itself). Name is required and email is validated; per-field `touched` plus a `submitted` flag control message display, and the POST (tagged `form: 'newsletter'`) only fires when both pass.

### Things to Know

- `useCart()` throws if used outside `CartProvider`, so every cart-touching component must render under the root layout (tests wrap manually in `CartProvider`).
- Quantity controls implement removal implicitly: `setQuantity` with a value below 1 filters the line out.
- Cart mutation closures capture `lines` from the current snapshot inside `useMemo`, so all mutations derive from the latest storage-backed state rather than component-local state.
- The checkout total shown in `CheckoutFlow` and `BagDrawer` is the subtotal only; shipping (and tax) are "CALCULATED AT CHECKOUT" on Shopify's invoice page.
- STATE is a required checkout field; @/lib/shopify-admin.ts sends it as `provinceCode` when it is exactly two letters (upper-cased) and as free-text `province` otherwise. Phone is optional but, when entered, must contain at least seven digits; empty phone and apt/suite are dropped from the shipping address rather than sent as empty strings.
- `startPayment` treats any non-2xx response or a response without `url` as failure and shows one generic message; the route's `{ error }` body is not surfaced to the customer. The `payment` state is never reset to `idle` after an error except by another attempt, and the button is only disabled while `starting`.
- Validation message copy lives next to the validators (`required('Enter your full name.')`, `'Enter a valid email address.'`, `'Enter a valid phone number.'`, `'Enter your zip code.'`, etc.); tests assert on it via `toHaveAccessibleDescription`, so wording changes require updating @/tests.
- `ProductGrid`/`ProductGallery` (`/looks/...`), `GalleryStack`/`GalleryViewer` (`/lookbook/...` or `/lookbook-season-1/...`, depending on which season's stacks the route passed in), and `NewsletterModal` (`NEWSLETTER_IMAGE.src`, always under `/lookbook/` since it is resolved from the current shoot) pass site-relative paths to `next/image`, so they go through Next's built-in optimizer; `BagDrawer`/`CheckoutFlow` may render legacy `cdn.shopify.com` images from bag lines persisted before the catalog switch, which is why that host remains allowlisted in @/next.config.ts.
- The cart and checkout code paths are exercised by tests with a synthetic purchasable product. In the live UI they are reachable for every look whose store product is in the committed @/lib/shopify-products.json, which after the sync is all twelve; "priced but not purchasable" is now only the state of a look the sync could not match.
- Gallery motion is split by mechanism. The tile *reveal* is JavaScript-gated: `GalleryStack` flips `revealed` when an `IntersectionObserver` (`rootMargin: '0px 0px -12% 0px'`, disconnected after the first hit) sees the tile, which transitions `.root` from opacity 0 / `translateY(32px)` over 0.9s with `transitionDelay = (position % 3) * 90ms` so the cascade follows column position. If `IntersectionObserver` is undefined the tile reveals immediately — this is why every tile is visible under jsdom in @/tests. The photo *drift* is pure CSS: inside `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`, `.frame` runs `drift` (translateY -6%→6% at scale 1.12) on a `view()` timeline over `animation-range: cover 0% cover 100%`. `.root` uses `overflow: clip` rather than `hidden` so the tile is not treated as the timeline's scroll container. Under `prefers-reduced-motion: reduce` the `.root` reveal is forced visible with no transition and the drift block does not apply, so those users get static tiles.
- `GalleryStack` mounts every frame of a stack in the DOM, so hidden frames still download once the tile is in view — for whichever season is on screen, every frame of that season is fetched while only each stack's current frame is shown. The gallery components know nothing about seasons: they receive stacks and render them, which is why Season 1 and Season 2 behave identically and why the tile labels say "Lookbook image N" on both routes. The per-tile `current` index is `useState`, not persisted, and independent of the viewer: opening the viewer copies `current` into `GalleryGrid`'s `open.frame`, and stepping frames full screen does not change what the tile shows after closing.
- `GalleryViewer`'s keydown effect has no dependency array, so it re-subscribes on every render and the handler always closes over the latest `frame` when computing the wrapped `step`. Its mount-only effect captures `document.activeElement` — the tile or expand button that opened it — and refocuses that element on unmount.

Created and maintained by Nori.
