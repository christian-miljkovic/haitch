import fixture from './fixtures/products.json';

export type ProductVariant = {
  id: number;
  size: string;
  price: number;
  available: boolean;
};

export type Product = {
  id: number;
  handle: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  variants: ProductVariant[];
};

type RawVariant = {
  id: number;
  title: string;
  price: string;
  available: boolean;
};

type RawImage = { src: string; position: number };

type RawProduct = {
  id: number;
  handle: string;
  title: string;
  body_html: string;
  images: RawImage[];
  variants: RawVariant[];
};

export const STORE_URL = 'https://haitch-usa.com';

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&mdash;': '—',
  '&ndash;': '–',
  '&lt;': '<',
  '&gt;': '>',
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeProducts(raw: unknown): Product[] {
  const { products } = raw as { products: RawProduct[] };
  return products.map((p) => ({
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: stripHtml(p.body_html),
    price: Number(p.variants[0]?.price ?? 0),
    images: [...p.images].sort((a, b) => a.position - b.position).map((i) => i.src),
    variants: p.variants.map((v) => ({
      id: v.id,
      size: v.title,
      price: Number(v.price),
      available: v.available,
    })),
  }));
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${STORE_URL}/products.json?limit=250`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new Error(`products.json returned ${res.status}`);
    return normalizeProducts(await res.json());
  } catch (error) {
    console.error('[shopify] live catalog fetch failed, serving fixture:', error);
    return normalizeProducts(fixture);
  }
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.handle === handle);
}
