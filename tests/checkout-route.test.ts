import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/checkout/route';
import store from '@/lib/shopify-products.json';

// A variant the store actually sells, so the stock guard lets the order through.
const VARIANT = store.products.flatMap((p) => p.variants).find((v) => v.available)!.id;

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'example.myshopify.com');
  vi.stubEnv('SHOPIFY_CLIENT_ID', 'client-id');
  vi.stubEnv('SHOPIFY_CLIENT_SECRET', 'client-secret');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Answer by URL: the token exchange is cached across requests, so call order
// is not a stable thing to assert on.
function stubShopify(graphqlResponse: unknown) {
  fetchMock.mockImplementation(async (url: string) =>
    url.endsWith('/admin/oauth/access_token')
      ? json({ access_token: 'shpat_x', expires_in: 86399 })
      : json(graphqlResponse)
  );
}

const request = (body: unknown) =>
  new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const bag = {
  lines: [{ variantId: VARIANT, quantity: 2 }],
  info: {
    email: 'harry@example.com',
    firstName: 'Harry',
    lastName: 'Tillman',
    address1: '1 Savile Row',
    city: 'New York',
    province: 'NY',
    zip: '10001',
    country: 'United States',
  },
};

describe('POST /api/checkout', () => {
  test('creates a Shopify draft order for the bag and returns its payment link', async () => {
    stubShopify({
      data: {
        draftOrderCreate: {
          draftOrder: { id: 'gid://shopify/DraftOrder/9', invoiceUrl: 'https://example.myshopify.com/invoices/abc' },
          userErrors: [],
        },
      },
    });

    const res = await POST(request(bag));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://example.myshopify.com/invoices/abc' });

    const [, mutationInit] = fetchMock.mock.calls.find(([url]) => (url as string).includes('/graphql.json')) as [string, RequestInit];
    expect((mutationInit.headers as Record<string, string>)['X-Shopify-Access-Token']).toBe('shpat_x');
    const { variables } = JSON.parse(mutationInit.body as string);
    expect(variables.input.lineItems).toEqual([{ variantId: `gid://shopify/ProductVariant/${VARIANT}`, quantity: 2 }]);
    expect(variables.input.email).toBe('harry@example.com');
    expect(variables.input.shippingAddress).toMatchObject({
      firstName: 'Harry',
      lastName: 'Tillman',
      address1: '1 Savile Row',
      city: 'New York',
      provinceCode: 'NY',
      zip: '10001',
      countryCode: 'US',
    });
  });

  test('rejects an empty bag without calling Shopify', async () => {
    const res = await POST(request({ lines: [], info: bag.info }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('surfaces Shopify user errors as a failed request', async () => {
    stubShopify({
      data: { draftOrderCreate: { draftOrder: null, userErrors: [{ field: ['lineItems'], message: 'Variant not found' }] } },
    });
    const res = await POST(request(bag));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/Variant not found/);
  });

  test('reports missing store configuration instead of crashing', async () => {
    vi.stubEnv('SHOPIFY_CLIENT_SECRET', '');
    const res = await POST(request(bag));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('refuses a bag line for a variant the store does not sell, without creating an order', async () => {
    stubShopify({});
    const res = await POST(request({ ...bag, lines: [{ variantId: 999999, quantity: 1 }] }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/no longer available/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
