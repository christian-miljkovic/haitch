import { NextResponse } from 'next/server';
import { EMAIL_RE } from '@/lib/format';
import { alertStudio } from '@/lib/notify';
import { CONTACT, readConfig, recordEnquiry, type Enquiry } from '@/lib/shopify-admin';

function parse(body: Record<string, unknown>): Enquiry | null {
  const field = (key: 'name' | 'email' | 'message') =>
    typeof body[key] === 'string' ? (body[key] as string).trim() : '';
  const enquiry = { name: field('name'), email: field('email'), message: field('message') };
  if (!enquiry.name || !EMAIL_RE.test(enquiry.email) || !enquiry.message) return null;
  return enquiry;
}

// Files a contact enquiry on the customer's Shopify record so it survives an
// email outage, then emails the studio. The email is best-effort; the enquiry
// is already recorded by the time we try to send it.
export async function POST(request: Request) {
  const config = readConfig();
  if (!config) {
    return NextResponse.json({ error: 'Store is not configured.' }, { status: 503 });
  }

  const enquiry = parse((await request.json().catch(() => ({}))) as Record<string, unknown>);
  if (!enquiry) {
    return NextResponse.json({ error: 'Name, a valid email address and a message are required.' }, { status: 400 });
  }

  try {
    await recordEnquiry(config, CONTACT, enquiry);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[contact] enquiry not recorded:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await alertStudio(CONTACT, enquiry);
  return NextResponse.json({ ok: true });
}
