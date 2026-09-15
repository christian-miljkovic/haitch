import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/contact/route';
import { alertCalls, expectOneAlertAbout, graphqlCalls, json, stubRoutes } from './helpers/api';

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
  new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const enquiry = {
  name: 'Dara Okafor',
  email: 'dara@example.com',
  message: 'Do you ship the overcoat to Lisbon?',
};

const stubShopify = (handlers: Record<string, unknown>, alert?: Response | (() => Response)) =>
  stubRoutes(fetchMock, handlers, alert);

const newCustomer = {
  customers: { customers: { nodes: [] } },
  customerCreate: { customerCreate: { customer: { id: 'gid://shopify/Customer/7' }, userErrors: [] } },
};

describe('POST /api/contact', () => {
  test('files a first-time enquiry as a tagged Shopify customer with the message in the notes', async () => {
    stubShopify(newCustomer);

    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);

    const create = graphqlCalls(fetchMock).find((c) => c.query.includes('customerCreate'));
    expect(create.variables.input).toMatchObject({
      email: 'dara@example.com',
      firstName: 'Dara',
      lastName: 'Okafor',
      tags: ['contact-enquiry'],
    });
    expect(create.variables.input.note).toMatch(/Contact enquiry/);
    expect(create.variables.input.note).toContain('Do you ship the overcoat to Lisbon?');
    // The contact form never asks for a phone number, so the note must not
    // pretend it did by carrying an empty one.
    expect(create.variables.input.note).not.toMatch(/^Phone:/m);
    // Writing to say hello is not consent to be marketed to.
    expect(create.variables.input.emailMarketingConsent).toBeUndefined();
  });

  test('appends to an existing customer’s notes and tags them, keeping earlier notes', async () => {
    stubShopify({
      customers: { customers: { nodes: [{ id: 'gid://shopify/Customer/9', note: 'Bought look 4.' }] } },
      customerUpdate: { customerUpdate: { customer: { id: 'gid://shopify/Customer/9' }, userErrors: [] } },
      tagsAdd: { tagsAdd: { node: { id: 'gid://shopify/Customer/9' }, userErrors: [] } },
    });

    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);
    const calls = graphqlCalls(fetchMock);
    expect(calls.some((c) => c.query.includes('customerCreate'))).toBe(false);

    const update = calls.find((c) => c.query.includes('customerUpdate'));
    expect(update.variables.input.id).toBe('gid://shopify/Customer/9');
    expect(update.variables.input.note.startsWith('Bought look 4.')).toBe(true);
    expect(update.variables.input.note).toContain('Do you ship the overcoat to Lisbon?');

    const tag = calls.find((c) => c.query.includes('tagsAdd'));
    expect(tag.variables).toMatchObject({ id: 'gid://shopify/Customer/9', tags: ['contact-enquiry'] });
  });

  test('emails the enquiry to the studio once it is filed on the Shopify record', async () => {
    stubShopify(newCustomer);

    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);

    expectOneAlertAbout(fetchMock, {
      replyTo: 'dara@example.com',
      subjectMatches: /contact enquiry.*dara okafor/i,
      bodyContains: ['Dara Okafor', 'dara@example.com', 'Do you ship the overcoat to Lisbon?'],
    });
  });

  test('still accepts the enquiry when the alert email cannot be sent', async () => {
    stubShopify(newCustomer, () => json({ message: 'Daily quota reached' }, 429));

    const res = await POST(request(enquiry));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(graphqlCalls(fetchMock).some((c) => c.query.includes('customerCreate'))).toBe(true);
  });

  test('rejects an enquiry with no message, reaching neither Shopify nor the mailer', async () => {
    const res = await POST(request({ ...enquiry, message: '   ' }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects a malformed email address, reaching neither Shopify nor the mailer', async () => {
    const res = await POST(request({ ...enquiry, email: 'dara@' }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('surfaces Shopify user errors and sends no alert', async () => {
    stubShopify({
      customers: { customers: { nodes: [] } },
      customerCreate: {
        customerCreate: { customer: null, userErrors: [{ field: ['email'], message: 'Email is invalid' }] },
      },
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
});
