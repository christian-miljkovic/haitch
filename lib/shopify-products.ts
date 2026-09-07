import type { ProductVariant } from './product';

// A product as read from the Shopify Admin API by scripts/sync-shopify.mjs.
export type StoreProduct = {
  id: number;
  handle: string;
  title: string;
  status: string;
  variants: ProductVariant[];
};

export type StoreMatch = {
  productId: number;
  status: string;
  variants: ProductVariant[];
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Joins store products to catalog entries: by handle when the store handle
// equals ours, otherwise by title ignoring case and punctuation. Store
// products with no catalog entry are ignored.
export function matchToCatalog(
  store: StoreProduct[],
  catalog: { handle: string; title: string }[]
): { matched: Record<string, StoreMatch>; unmatched: string[] } {
  const byHandle = new Map(store.map((p) => [p.handle, p]));
  const byTitle = new Map(store.map((p) => [normalize(p.title), p]));
  const matched: Record<string, StoreMatch> = {};
  const unmatched: string[] = [];

  for (const entry of catalog) {
    const product = byHandle.get(entry.handle) ?? byTitle.get(normalize(entry.title));
    if (!product) {
      unmatched.push(entry.handle);
      continue;
    }
    matched[entry.handle] = { productId: product.id, status: product.status, variants: product.variants };
  }
  return { matched, unmatched };
}

// Orders store variants by the line-sheet size run ("44, 46, 48 EU" or
// "XS, S, M, L, XL, XXL"); sizes the run does not mention keep store order at the end.
export function orderVariants(variants: ProductVariant[], sizes: string): ProductVariant[] {
  const run = sizes
    .replace(/\b(EU|US|UK)\b/gi, '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const rank = (size: string) => {
    const i = run.indexOf(size.trim().toUpperCase());
    return i === -1 ? run.length : i;
  };
  return [...variants].sort((a, b) => rank(a.size) - rank(b.size));
}
