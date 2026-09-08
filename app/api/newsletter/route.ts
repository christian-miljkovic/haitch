import { NextResponse } from 'next/server';
import { EMAIL_RE } from '@/lib/format';
import { readConfig, subscribeToNewsletter } from '@/lib/shopify-admin';

// Adds a newsletter signup to the Shopify customer list with marketing consent.
export async function POST(request: Request) {
  const config = readConfig();
  if (!config) {
    return NextResponse.json({ error: 'Store is not configured.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { name?: unknown; email?: unknown };
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A name and a valid email address are required.' }, { status: 400 });
  }

  try {
    await subscribeToNewsletter(config, name, email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[newsletter] subscription failed:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
