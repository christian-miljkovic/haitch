import { expect, vi } from 'vitest';

// Shared stubbing for the route handlers that talk to Shopify and then send an
// alert email. Both hosts are reached with plain `fetch`, so one stub covers
// them: calls are routed by URL, and Shopify's by the GraphQL operation named
// in the body.

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const ALERT_URL = 'https://api.resend.com/emails';

type Stub = ReturnType<typeof vi.fn>;

/** Answers Shopify with `handlers`, keyed by GraphQL operation name, and the
 *  alert provider with `alert` — which may return a Response or throw, to
 *  stand in for a network failure. */
export function stubRoutes(
  fetchMock: Stub,
  handlers: Record<string, unknown>,
  alert: Response | (() => Response | Promise<Response>) = () => new Response(null, { status: 200 })
) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.startsWith(ALERT_URL)) return typeof alert === 'function' ? alert() : alert;
    if (url.endsWith('/admin/oauth/access_token')) return json({ access_token: 'shpat_x', expires_in: 86399 });
    const { query } = JSON.parse(init?.body as string);
    const op = Object.keys(handlers).find((name) => query.includes(name));
    // Failing loudly beats handing back empty data, which surfaces as a
    // TypeError deep inside the library instead of naming the missing stub.
    if (!op) throw new Error(`No stub for Shopify operation in query: ${query.trim().slice(0, 80)}`);
    return json({ data: handlers[op] });
  });
}

/** The GraphQL request bodies Shopify was sent. */
export const graphqlCalls = (fetchMock: Stub) =>
  fetchMock.mock.calls
    .filter(([url]) => (url as string).includes('/graphql.json'))
    .map(([, init]) => JSON.parse((init as RequestInit).body as string));

/** The alert emails that were sent, as { payload, authorization } pairs. */
export const alertCalls = (fetchMock: Stub) =>
  fetchMock.mock.calls
    .filter(([url]) => (url as string).startsWith(ALERT_URL))
    .map(([, init]) => {
      const request = init as RequestInit;
      const headers = request.headers as Record<string, string>;
      return {
        payload: JSON.parse(request.body as string),
        authorization: headers.Authorization ?? headers.authorization,
      };
    });

/** Asserts the single alert email sent reads like a staff alert about `about`.
 *  Who it goes to and how it authenticates are behaviours of lib/notify.ts and
 *  are pinned in tests/notify.test.ts, so this only checks the alert reached
 *  somebody and says the right thing. */
export function expectOneAlertAbout(
  fetchMock: Stub,
  about: { replyTo: string; subjectMatches: RegExp; bodyContains: string[] }
) {
  const alerts = alertCalls(fetchMock);
  expect(alerts).toHaveLength(1);
  const { payload } = alerts[0];
  expect(payload.to.length).toBeGreaterThan(0);
  expect(payload.reply_to).toBe(about.replyTo);
  expect(payload.subject).toMatch(about.subjectMatches);
  for (const fragment of about.bodyContains) expect(payload.text).toContain(fragment);
}
