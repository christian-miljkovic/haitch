import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/newsletter/route';

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

const request = (body: unknown) =>
  new Request('http://localhost/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// Route Shopify calls by URL and by the GraphQL operation in the body.
function stubShopify(handlers: Record<string, unknown>) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/admin/oauth/access_token')) return json({ access_token: 'shpat_x', expires_in: 86399 });
    const { query } = JSON.parse(init?.body as string);
    const op = Object.keys(handlers).find((name) => query.includes(name));
    return json({ data: op ? handlers[op] : {} });
  });
}

const graphqlCalls = () =>
  fetchMock.mock.calls
    .filter(([url]) => (url as string).includes('/graphql.json'))
    .map(([, init]) => JSON.parse((init as RequestInit).body as string));

describe('POST /api/newsletter', () => {
  test('creates a subscribed Shopify customer for a new address', async () => {
    stubShopify({
      customers: { customers: { nodes: [] } },
      customerCreate: { customerCreate: { customer: { id: 'gid://shopify/Customer/1' }, userErrors: [] } },
    });

    const res = await POST(request({ name: 'Harry Tillman', email: 'harry@example.com' }));
    expect(res.status).toBe(200);

    const create = graphqlCalls().find((c) => c.query.includes('customerCreate'));
    expect(create.variables.input).toMatchObject({
      email: 'harry@example.com',
      firstName: 'Harry',
      lastName: 'Tillman',
      emailMarketingConsent: { marketingState: 'SUBSCRIBED' },
    });
  });

  test('subscribes an existing customer instead of failing on a duplicate email', async () => {
    stubShopify({
      customers: { customers: { nodes: [{ id: 'gid://shopify/Customer/42' }] } },
      customerEmailMarketingConsentUpdate: {
        customerEmailMarketingConsentUpdate: { customer: { id: 'gid://shopify/Customer/42' }, userErrors: [] },
      },
    });

    const res = await POST(request({ name: 'Harry Tillman', email: 'harry@example.com' }));
    expect(res.status).toBe(200);
    const calls = graphqlCalls();
    expect(calls.some((c) => c.query.includes('customerCreate'))).toBe(false);
    const update = calls.find((c) => c.query.includes('customerEmailMarketingConsentUpdate'));
    expect(update.variables.input).toMatchObject({
      customerId: 'gid://shopify/Customer/42',
      emailMarketingConsent: { marketingState: 'SUBSCRIBED' },
    });
  });

  test('rejects an invalid email without calling Shopify', async () => {
    const res = await POST(request({ name: 'Harry', email: 'not-an-email' }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('surfaces Shopify user errors', async () => {
    stubShopify({
      customers: { customers: { nodes: [] } },
      customerCreate: { customerCreate: { customer: null, userErrors: [{ field: ['email'], message: 'Email is invalid' }] } },
    });
    const res = await POST(request({ name: 'Harry', email: 'harry@example.com' }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/Email is invalid/);
  });

  test('reports missing store configuration', async () => {
    vi.stubEnv('SHOPIFY_CLIENT_SECRET', '');
    const res = await POST(request({ name: 'Harry', email: 'harry@example.com' }));
    expect(res.status).toBe(503);
  });
});
