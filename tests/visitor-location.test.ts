import { describe, expect, test } from 'vitest';
import { GET } from '@/app/api/visitor-location/route';

describe('visitor location endpoint', () => {
  test('returns approximate state and decoded city without identifying headers', async () => {
    const response = GET(new Request('https://example.com/api/visitor-location', {
      headers: { 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'NY',
        'x-vercel-ip-city': 'New%20York', 'x-forwarded-for': '192.0.2.1' },
    }));
    expect(await response.json()).toEqual({ state: 'US-NY', city: 'US-NY / New York' });
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  test('does not invent geography when platform headers are absent', async () => {
    expect(await GET(new Request('https://example.com/api/visitor-location')).json()).toEqual({});
  });
  test('tolerates malformed city encoding and unsupported country values', async () => {
    const response = GET(new Request('https://example.com/api/visitor-location', {
      headers: { 'x-vercel-ip-country': 'bad', 'x-vercel-ip-city': '%ZZ' },
    }));
    expect(await response.json()).toEqual({});
  });
});
