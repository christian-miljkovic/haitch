import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/appointment/route';
import { ALERT_URL, alertCalls, expectOneAlertAbout, graphqlCalls, json, stubRoutes } from './helpers/api';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'example.myshopify.com');
  vi.stubEnv('SHOPIFY_CLIENT_ID', 'client-id');
  vi.stubEnv('SHOPIFY_CLIENT_SECRET', 'client-secret');
  vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

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

const stubShopify = (
  handlers: Record<string, unknown>,
  alert?: Response | (() => Response | Promise<Response>)
) =>
  stubRoutes(fetchMock, handlers, alert);

const newCustomer = {
  customers: { customers: { nodes: [] } },
  customerCreate: { customerCreate: { customer: { id: 'gid://shopify/Customer/1' }, userErrors: [] } },
};

describe('POST /api/appointment', () => {
  test('records a first-time enquiry as a tagged Shopify customer with the message in the notes', async () => {
    stubShopify(newCustomer);

    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);

    const create = graphqlCalls(fetchMock).find((c) => c.query.includes('customerCreate'));
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
    const calls = graphqlCalls(fetchMock);
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

  test('surfaces Shopify user errors and sends no alert', async () => {
    stubShopify({
      customers: { customers: { nodes: [] } },
      customerCreate: { customerCreate: { customer: null, userErrors: [{ field: ['email'], message: 'Email is invalid' }] } },
    });
    const res = await POST(request(enquiry));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/Email is invalid/);
    expect(alertCalls(fetchMock)).toHaveLength(0);
  });

  test('reports missing store configuration', async () => {
    vi.stubEnv('SHOPIFY_CLIENT_SECRET', '');
    const res = await POST(request(enquiry));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('emails the showroom the enquiry once it is filed on the Shopify record', async () => {
    stubShopify(newCustomer);

    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);

    expectOneAlertAbout(fetchMock, {
      replyTo: 'harry@example.com',
      subjectMatches: /appointment request.*harry tillman/i,
      bodyContains: ['Harry Tillman', 'harry@example.com', '2125551234', 'Suit fitting please'],
    });

    // The record is the source of truth, so it must be written before we
    // promise anybody an appointment exists.
    const urls = fetchMock.mock.calls.map(([url]) => url as string);
    expect(urls.findIndex((url) => url.includes('/graphql.json'))).toBeLessThan(
      urls.findIndex((url) => url.startsWith(ALERT_URL))
    );
  });

  test('still confirms the booking when the alert email cannot be sent', async () => {
    stubShopify(newCustomer, () => json({ message: 'Domain is not verified' }, 403));

    const res = await POST(request(enquiry));

    // The request is safely on the Shopify record, so the customer must not be
    // told their booking failed just because the alert bounced.
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(graphqlCalls(fetchMock).some((c) => c.query.includes('customerCreate'))).toBe(true);
  });

  test('still confirms the booking when the mailer is unreachable', async () => {
    stubShopify(newCustomer, () => {
      throw new Error('getaddrinfo ENOTFOUND api.resend.com');
    });

    // A rejected fetch is a different branch from a refused send, and it is
    // the one that would otherwise 500 an enquiry that is already recorded.
    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);
  });

  test('writes a dash for an appointment that arrives with no phone number', async () => {
    stubShopify(newCustomer);

    await POST(request({ ...enquiry, phone: '' }));

    const create = graphqlCalls(fetchMock).find((c) => c.query.includes('customerCreate'));
    expect(create.variables.input.note).toMatch(/^Phone: —$/m);
  });

  test('files the request without emailing when no email provider is configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    stubShopify(newCustomer);

    const res = await POST(request(enquiry));

    expect(res.status).toBe(200);
    expect(alertCalls(fetchMock)).toHaveLength(0);
    expect(graphqlCalls(fetchMock).some((c) => c.query.includes('customerCreate'))).toBe(true);
  });
});
