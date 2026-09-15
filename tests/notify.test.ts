import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { alertStudio } from '@/lib/notify';
import { APPOINTMENT } from '@/lib/shopify-admin';
import { ALERT_URL, alertCalls, json } from './helpers/api';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(json({ id: 'email-1' }));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const enquiry = {
  name: 'Harry Tillman',
  email: 'harry@example.com',
  phone: '2125551234',
  message: 'Suit fitting please',
};

const sent = () => alertCalls(fetchMock)[0].payload;

describe('studio alerts', () => {
  test('goes to the studio address when no recipient is configured', async () => {
    await alertStudio(APPOINTMENT, enquiry);
    expect(sent().to).toEqual(['info@haitch-usa.com']);
  });

  test('goes to every address listed in ALERT_TO, ignoring spacing and empty entries', async () => {
    vi.stubEnv('ALERT_TO', ' studio@haitch-usa.com , harry@haitch-usa.com ,, ');
    await alertStudio(APPOINTMENT, enquiry);
    expect(sent().to).toEqual(['studio@haitch-usa.com', 'harry@haitch-usa.com']);
  });

  test('sends from the domain the mail provider verified, never from the root domain', async () => {
    vi.stubEnv('RESEND_EMAIL_DOMAIN', 'send.haitch-usa.com');
    await alertStudio(APPOINTMENT, enquiry);
    // The apex carries Microsoft 365 MX records and a hard-fail SPF record, so
    // an alert claiming to come from it would be refused outright.
    expect(sent().from).toContain('@send.haitch-usa.com');
    expect(sent().from).not.toMatch(/@haitch-usa\.com>/);
  });

  test('follows the verified domain if the provisioned one ever changes', async () => {
    vi.stubEnv('RESEND_EMAIL_DOMAIN', 'mail.haitch-usa.com');
    await alertStudio(APPOINTMENT, enquiry);
    expect(sent().from).toContain('@mail.haitch-usa.com');
  });

  test('sends nothing at all when no API key is configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    await alertStudio(APPOINTMENT, enquiry);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('survives the mailer being unreachable, so a caller can never be broken by it', async () => {
    fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND api.resend.com'));
    // Callers deliberately do not wrap this, so a DNS or TLS failure must
    // resolve rather than reject.
    await expect(alertStudio(APPOINTMENT, enquiry)).resolves.toBeUndefined();
  });

  test('survives the mailer refusing the send', async () => {
    fetchMock.mockResolvedValue(json({ message: 'Domain is not verified' }, 403));
    await expect(alertStudio(APPOINTMENT, enquiry)).resolves.toBeUndefined();
  });

  test('survives a mailer response that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>502 Bad Gateway</html>', { status: 502 }));
    await expect(alertStudio(APPOINTMENT, enquiry)).resolves.toBeUndefined();
  });

  test('authenticates with the configured API key', async () => {
    await alertStudio(APPOINTMENT, enquiry);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(ALERT_URL);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-resend-key');
  });

  test('omits the phone line for an enquiry that never asked for one', async () => {
    await alertStudio(APPOINTMENT, { name: 'Dara Okafor', email: 'dara@example.com', message: 'Hello' });
    expect(sent().text).not.toContain('Phone');
    expect(sent().text).toContain('Hello');
  });
});
