import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/appointment/route';

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
  new Request('http://localhost/api/appointment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const enquiry = {
  name: 'Harry Tillman',
  email: 'harry@example.com',
  phone: '2125551234',
  message: 'Suit fitting please',
};

// Route Shopify calls by URL and by the GraphQL operation named in the body.
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

describe('POST /api/appointment', () => {
  test('records a first-time enquiry as a tagged Shopify customer with the message in the notes', async () => {
    stubShopify({
      customers: { customers: { nodes: [] } },
      customerCreate: { customerCreate: { customer: { id: 'gid://shopify/Customer/1' }, userErrors: [] } },
    });

    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);

    const create = graphqlCalls().find((c) => c.query.includes('customerCreate'));
    expect(create.variables.input).toMatchObject({
      email: 'harry@example.com',
      firstName: 'Harry',
      lastName: 'Tillman',
      tags: ['appointment-request'],
    });
    expect(create.variables.input.note).toMatch(/Appointment request/);
    expect(create.variables.input.note).toContain('2125551234');
    expect(create.variables.input.note).toContain('Suit fitting please');
    // No marketing consent is implied by asking for an appointment.
    expect(create.variables.input.emailMarketingConsent).toBeUndefined();
  });

  test('appends to an existing customer’s notes and tags them, keeping earlier notes', async () => {
    stubShopify({
      customers: { customers: { nodes: [{ id: 'gid://shopify/Customer/42', note: 'Prefers mornings.' }] } },
      customerUpdate: { customerUpdate: { customer: { id: 'gid://shopify/Customer/42' }, userErrors: [] } },
      tagsAdd: { tagsAdd: { node: { id: 'gid://shopify/Customer/42' }, userErrors: [] } },
    });

    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);
    const calls = graphqlCalls();
    expect(calls.some((c) => c.query.includes('customerCreate'))).toBe(false);

    const update = calls.find((c) => c.query.includes('customerUpdate'));
    expect(update.variables.input.id).toBe('gid://shopify/Customer/42');
    expect(update.variables.input.note.startsWith('Prefers mornings.')).toBe(true);
    expect(update.variables.input.note).toContain('Suit fitting please');

    const tag = calls.find((c) => c.query.includes('tagsAdd'));
    expect(tag.variables).toMatchObject({ id: 'gid://shopify/Customer/42', tags: ['appointment-request'] });
  });

  test('rejects an incomplete request without calling Shopify', async () => {
    const res = await POST(request({ ...enquiry, email: 'nope' }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('surfaces Shopify user errors', async () => {
    stubShopify({
      customers: { customers: { nodes: [] } },
      customerCreate: { customerCreate: { customer: null, userErrors: [{ field: ['email'], message: 'Email is invalid' }] } },
    });
    const res = await POST(request(enquiry));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/Email is invalid/);
  });

  test('reports missing store configuration', async () => {
    vi.stubEnv('SHOPIFY_CLIENT_SECRET', '');
    const res = await POST(request(enquiry));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
