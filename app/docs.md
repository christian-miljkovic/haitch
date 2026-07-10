# Noridoc: app

Path: @/app

### Overview

Next.js App Router routes for the storefront: the hero landing page, shop grid, product detail pages, editorial collections gallery, appointment booking, about, and the custom checkout stepper. Pages are thin — they fetch data from @/lib and compose components from @/components, with styling in colocated CSS Modules plus @/app/globals.css.

### How it fits into the larger codebase

@/app/layout.tsx is the composition root: it wraps every page in `CartProvider` (from @/components/CartContext.tsx) and mounts the global `Nav`, `Footer`, and `BagDrawer`, so cart state is available on every route. Catalog-driven pages (`/shop`, `/products/[handle]`) call `getProducts`/`getProduct` from @/lib/shopify.ts; image-driven pages (`/`, `/collections`) read curated URLs from @/lib/gallery.ts. `/checkout` renders @/components/CheckoutFlow.tsx, which ends by linking out to Shopify's hosted checkout.

### Core Implementation

| Route | Rendering | Notes |
|---|---|---|
| `/` | Static | Full-bleed hero image (`HERO_IMAGE`) with a SHOP THE COLLECTION link |
| `/shop` | ISR (`revalidate = 600`) | Fetches products, renders `ProductGrid` (4-across, hover image swap) |
| `/products/[handle]` | SSG via `generateStaticParams` + ISR 600s | `notFound()` on unknown handle; `ProductGallery` scroll column + sticky purchase panel with `AddToCart`; shows a MADE TO ORDER note when the description matches `/made to order/i` |
| `/collections` | Static | Masonry gallery over `GALLERY_IMAGES` |
| `/appointment` | Static shell | Renders client `AppointmentForm` (Formspree) |
| `/about` | Static | Brand copy only |
| `/checkout` | Static shell | Renders client `CheckoutFlow`; all state is client-side |

Metadata uses the root template `%s — HAITCH`; each page exports its own `title`. `params` on the product page is a Promise (Next 16 convention) and is awaited.

### Things to Know

- ISR + fixture fallback means catalog pages always build: if the live `products.json` is unreachable at build or revalidate time, @/lib/shopify.ts serves the committed fixture, so `generateStaticParams` still yields handles.
- `/checkout` and `/appointment` pages are server components that only host client components — no data fetching happens on these routes.
- Product-page freshness is bounded by the 600s revalidate on both the page (`export const revalidate`) and the underlying fetch in @/lib/shopify.ts.
- All `next/image` usage routes through the custom Shopify CDN loader configured in @/next.config.ts; `sizes` props are tuned per layout (e.g. `25vw` grid tiles, `55vw` gallery slides).

Created and maintained by Nori.
