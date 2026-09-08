import { NextResponse } from 'next/server';
import { EMAIL_RE } from '@/lib/format';
import { readConfig, recordAppointmentRequest, type AppointmentRequest } from '@/lib/shopify-admin';

function parse(body: Record<string, unknown>): AppointmentRequest | null {
  const field = (key: keyof AppointmentRequest) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '');
  const enquiry = { name: field('name'), email: field('email'), phone: field('phone'), message: field('message') };
  if (!enquiry.name || !EMAIL_RE.test(enquiry.email) || !enquiry.message) return null;
  return enquiry;
}

// Files an appointment request on the customer's Shopify record, tagged for the showroom to find.
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
    await recordAppointmentRequest(config, enquiry);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[appointment] request not recorded:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
