import { describe, expect, test, vi } from 'vitest';
import { PRODUCTS_QUERY, fetchAdminToken, fetchAllProducts } from '../scripts/sync-shopify.mjs';
import { matchToCatalog } from '@/lib/shopify-products';

const config = {
  domain: 'example.myshopify.com',
  clientId: 'client-id',
  clientSecret: 'client-secret',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// One page of Admin GraphQL products, shaped like Shopify returns it.
const page = (cursor: string | null, products: unknown[]) => ({
  data: {
    products: {
      pageInfo: { hasNextPage: cursor !== null, endCursor: cursor },
      nodes: products,
    },
  },
});

const gqlProduct = (handle: string, title: string, status: string, variants: [string, string, boolean][]) => ({
  id: `gid://shopify/Product/${handle.length}001`,
  handle,
  title,
  status,
  variants: {
    nodes: variants.map(([size, price, available], i) => ({
      id: `gid://shopify/ProductVariant/${1000 + i}`,
      title: size,
      price,
      availableForSale: available,
    })),
  },
});

describe('admin token exchange', () => {
  test('posts the client credentials grant to the store and returns the token', async () => {
    const fetch = vi.fn(async () => jsonResponse({ access_token: 'shpat_x', expires_in: 86399 }));
    const token = await fetchAdminToken(config, fetch as unknown as typeof globalThis.fetch);
    expect(token).toBe('shpat_x');
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://example.myshopify.com/admin/oauth/access_token');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      grant_type: 'client_credentials',
      client_id: 'client-id',
      client_secret: 'client-secret',
    });
  });

  test('throws with the store’s message when the exchange fails', async () => {
    const fetch = vi.fn(async () => jsonResponse({ error: 'invalid_client' }, 401));
    await expect(fetchAdminToken(config, fetch as unknown as typeof globalThis.fetch)).rejects.toThrow(
      /invalid_client/
    );
  });
});

describe('product read', () => {
  test('pages through every product and flattens variants to numeric ids', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(page('c1', [gqlProduct('tuxedo-jacket-in-black-barathea', 'TUXEDO JACKET IN BLACK BARATHEA', 'DRAFT', [['48', '1800.00', true]])]))
      )
      .mockResolvedValueOnce(
        jsonResponse(page(null, [gqlProduct('shirt-in-pink-stripe', 'Shirt in Pink Stripe', 'ACTIVE', [['S', '450.00', false], ['M', '450.00', true]])]))
      );
    const products = await fetchAllProducts(config, 'shpat_x', fetch as unknown as typeof globalThis.fetch);

    expect(products).toEqual([
      {
        id: 31001,
        handle: 'tuxedo-jacket-in-black-barathea',
        title: 'TUXEDO JACKET IN BLACK BARATHEA',
        status: 'DRAFT',
        variants: [{ id: 1000, size: '48', price: 1800, available: true }],
      },
      {
        id: 20001,
        handle: 'shirt-in-pink-stripe',
        title: 'Shirt in Pink Stripe',
        status: 'ACTIVE',
        variants: [
          { id: 1000, size: 'S', price: 450, available: false },
          { id: 1001, size: 'M', price: 450, available: true },
        ],
      },
    ]);

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/^https:\/\/example\.myshopify\.com\/admin\/api\/\d{4}-\d{2}\/graphql\.json$/);
    expect((init.headers as Record<string, string>)['X-Shopify-Access-Token']).toBe('shpat_x');
    expect(JSON.parse(init.body as string).query).toBe(PRODUCTS_QUERY);
    expect(JSON.parse((fetch.mock.calls[1] as unknown as [string, RequestInit])[1].body as string).variables).toEqual({ cursor: 'c1' });
  });
});

describe('matching store products to the catalog', () => {
  const catalog = [
    { handle: 'tuxedo-jacket-in-black-barathea', title: 'TUXEDO JACKET IN BLACK BARATHEA' },
    { handle: 'shirt-in-pink-stripe', title: 'SHIRT IN PINK STRIPE' },
    { handle: 'light-grey-cotton-trousers', title: 'LIGHT GREY COTTON TROUSERS' },
  ];
  const store = [
    { id: 1, handle: 'tuxedo-jacket-in-black-barathea', title: 'Tuxedo Jacket in Black Barathea', status: 'DRAFT', variants: [{ id: 11, size: '48', price: 1800, available: true }] },
    { id: 2, handle: 'pink-stripe-shirt', title: 'Shirt in Pink Stripe', status: 'ACTIVE', variants: [{ id: 21, size: 'M', price: 450, available: true }] },
    { id: 3, handle: 'white-track-jacket', title: 'WHITE TRACK JACKET', status: 'ACTIVE', variants: [{ id: 31, size: 'M', price: 750, available: true }] },
  ];

  test('matches by handle first, then by title ignoring case and punctuation', () => {
    const { matched, unmatched } = matchToCatalog(store, catalog);
    expect(Object.keys(matched).sort()).toEqual(['shirt-in-pink-stripe', 'tuxedo-jacket-in-black-barathea']);
    expect(matched['shirt-in-pink-stripe']).toEqual({
      productId: 2,
      status: 'ACTIVE',
      variants: [{ id: 21, size: 'M', price: 450, available: true }],
    });
    expect(unmatched).toEqual(['light-grey-cotton-trousers']);
  });

  test('ignores store products that are not in the catalog', () => {
    const { matched } = matchToCatalog(store, catalog);
    expect(JSON.stringify(matched)).not.toContain('white-track-jacket');
  });
});
