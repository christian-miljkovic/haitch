# HAITCH

Redesigned storefront for [haitch-usa.com](https://haitch-usa.com) — a NYC menswear label. Next.js 16 App Router, TypeScript, CSS Modules.

## How it works

- **Catalog** — a static, in-repo line sheet in `lib/catalog.ts`: twelve "Looks" (tailored jackets, trousers, shirts) with copy transcribed from the brand's Website 2.0 Outline. Photos live in `public/looks/look-N/` and are indexed by the generated `lib/looks.json`. Nothing is fetched from Shopify; `/shop` and product pages are fully static.
- **Prices and purchasing** — every look carries a `price` from the line sheet (jackets, trousers, and shirts each in their own band), shown on the shop grid and product page. Purchasing is not live: the looks do not exist in Shopify yet, so every product has empty `variants` and the add-to-cart control stays hidden until Shopify variant IDs are supplied.
- **Bag** — client-side cart in `localStorage` (`components/CartContext.tsx`), YSL-style slide-in drawer.
- **Checkout** — custom Bag → Information → Shipping steps (`/checkout`), then a hand-off to Shopify's hosted checkout via a cart permalink with contact/address prefilled. Shop Pay / shop.app, Apple Pay, Google Pay and cards all appear there automatically. (Shopify does not allow custom payment pages — the hosted checkout is where Shop Pay lives.)
- **Appointments / newsletter** — post to Formspree. Every form (appointment, newsletter, checkout) validates inline: a message appears under a field once it is blurred or the user tries to advance, and advancing/submitting is blocked until the step passes (`lib/validation.ts`, `components/FieldError.tsx`).
- **Images** — everything is local and served through Next's built-in image optimizer: look photos (`public/looks`), the collections gallery (`public/lookbook`, the LOOKBOOK shoot indexed by `lib/lookbook.json` with real dimensions), the newsletter picture (lookbook frame 1012 per the Website 2.0 Outline deck, resolved as `NEWSLETTER_IMAGE` in `lib/gallery.ts` with a portrait-frame fallback), and the landing hero (`public/home`: a landscape colour frame for desktop and a black-and-white portrait frame for phones, exported as `HERO_IMAGE` / `HERO_IMAGE_MOBILE`). The hero files were downscaled once with sharp from the LOOKBOOK originals and have no import script; regenerate by hand if the frames change. `cdn.shopify.com` remains in `next.config.ts` only so bags saved before the catalog switch can still show their legacy product images.
- **Collections gallery** — three balanced columns of lookbook tiles (`components/GalleryGrid.tsx`, grouping and balancing from `lib/gallery-layout.ts`). Every tile is clickable: a lone frame opens a full-screen viewer; runs of near-identical frames are collapsed into one tile that cycles through its frames on tap with a crossfade and an "i — k" counter, plus a small expand control that opens the current frame full screen (`components/GalleryStack.tsx`). The viewer (`components/GalleryViewer.tsx`) steps frames with arrow keys or side controls and closes on Escape. Tiles rise into view as they scroll on screen and their photos drift slightly on a CSS scroll-driven timeline (both off under reduced motion); on phones the columns collapse to one in shoot order.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest + React Testing Library
npm run lint
npm run build
```

## Importing look photography

```bash
npm run import:looks -- ~/path/to/High-res-Ecom   # [--width 2000] [--quality 80]
```

`scripts/import-looks.mjs` reads a folder of `Look N/` directories of high-res JPEGs, downscales each to 2000px wide with sharp (EXIF-rotated, mozjpeg, never enlarged), writes `public/looks/look-N/01.jpg…` in filename order, removes stale output, and regenerates `lib/looks.json`. Do not hand-edit the manifest. Copy (titles, sizes, descriptions, details) is edited in `lib/catalog.ts`.

## Importing the lookbook

```bash
npm run import:lookbook -- ~/path/to/LOOKBOOK   # [--max-width 1600] [--max-height 2000] [--quality 78]
```

`scripts/import-lookbook.mjs` walks the LOOKBOOK folder recursively (root and `BOOKLET SELECTS`, jpg and png), keeps one file per 4-digit frame number in the filename (largest file wins when a frame was exported twice), EXIF-rotates and downscales each to fit inside the max box with sharp (never enlarged), writes `public/lookbook/<frame>.jpg` in frame order, removes stale output, and regenerates `lib/lookbook.json` with each image's `src`, `width`, `height` and a `group` id. Groups mark runs of near-identical frames: walking frames in order, a new group starts when the frame number jumps by 10 or more, a 24×24 greyscale signature differs from the previous frame by a mean pixel distance above 0.2, the orientation flips, or the group already has 6 frames. `/collections` shows each group as one tap-to-cycle tile, so re-running the import recomputes the stacks along with the images (the committed shoot yields 61 tiles from 144 frames). The committed gallery uses the defaults (1600×2000 box, quality 78), which suit a three-column gallery. Do not hand-edit the manifest; `/collections` and the newsletter modal read it through `lib/gallery.ts`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FORMSPREE_ID` | Formspree form ID for the appointment and newsletter forms (create one at formspree.io) |

Without it the forms still render but submissions will fail.

## Deploying to Vercel

Zero-config: import the repo in Vercel, set `NEXT_PUBLIC_FORMSPREE_ID`, deploy. No `vercel.json` needed.

## Tests

Behavior tests live in `tests/` — catalog integrity (twelve looks, unique handles, every image on disk), the landing hero (both photos on disk, desktop landscape / mobile portrait, each served to its viewport), both import scripts (run for real with sharp against generated images: resizing, dedupe by frame, stale cleanup, manifests), the collections gallery (every lookbook frame on disk, one visible `img` per stack, tapping a stack advances and wraps with an updated accessible name, a lone-frame tile opens the full-screen viewer and Escape closes it, a stack's expand control opens the viewer where Next / ArrowLeft step and wrap and Close dismisses), the stack/column layout helpers (`stackImages`, generic `balanceColumns`), the product page in both priced and unpriced states, checkout permalink construction, bag behavior (add/quantity/remove/persistence), bag drawer, appointment form field progression, checkout stepper, newsletter modal (including that it shows the lib-resolved `NEWSLETTER_IMAGE`), and shop grid. Form tests assert inline validation messages via accessible descriptions and that nothing is posted or advanced while invalid. Cart and checkout tests use a synthetic purchasable product from `tests/helpers/products.ts`.

## Reconnecting Shopify later

Create the twelve products in the store, then either map by handle (catalog handles are fixed slug-style handles, matching Shopify's handle generation) or fill in each catalog entry's `variants` with real Shopify variant IDs (prices are already in `lib/catalog.ts`). The previous `products.json` fetch/normalize code is in git history.
