export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const headers = request.headers;
  const countryValue = headers.get('x-vercel-ip-country') ?? '';
  const regionValue = headers.get('x-vercel-ip-country-region') ?? '';
  const country = /^[A-Z]{2}$/.test(countryValue) ? countryValue : '';
  const region = /^[A-Z0-9-]{1,10}$/i.test(regionValue) ? regionValue : '';
  const location: { state?: string; city?: string } = {};
  if (country && region) location.state = `${country}-${region}`;
  try {
    const city = decodeURIComponent(headers.get('x-vercel-ip-city') ?? '').trim();
    if (country && city && city.length <= 128 && !/[\u0000-\u001f\u007f]/.test(city)) {
      location.city = `${location.state ?? country} / ${city}`;
    }
  } catch {
    // Malformed platform geography is unavailable, not a capture failure.
  }
  return Response.json(location, { headers: { 'Cache-Control': 'private, no-store' } });
}
