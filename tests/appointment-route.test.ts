import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/appointment/route';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('RESEND_API_KEY', 're_test');
  vi.stubEnv('APPOINTMENT_TO', 'showroom@example.com');
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

describe('POST /api/appointment', () => {
  test('emails the showroom with the request and lets them reply to the customer', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'email_1' }), { status: 200 }));
    const res = await POST(request(enquiry));
    expect(res.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test');
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(['showroom@example.com']);
    expect(body.reply_to).toBe('harry@example.com');
    expect(body.subject).toMatch(/Harry Tillman/);
    expect(body.text).toContain('2125551234');
    expect(body.text).toContain('Suit fitting please');
  });

  test('rejects an incomplete request without sending anything', async () => {
    const res = await POST(request({ ...enquiry, email: 'nope' }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('reports a failed send', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Domain not verified' }), { status: 403 }));
    const res = await POST(request(enquiry));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/Domain not verified/);
  });

  test('reports missing email configuration', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await POST(request(enquiry));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
