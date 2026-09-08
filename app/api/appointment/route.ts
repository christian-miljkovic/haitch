import { NextResponse } from 'next/server';
import { EMAIL_RE } from '@/lib/format';

const DEFAULT_FROM = 'HAITCH <appointments@haitch-usa.com>';
const DEFAULT_TO = 'info@haitch-usa.com';

type Enquiry = { name: string; email: string; phone: string; message: string };

function parse(body: Record<string, unknown>): Enquiry | null {
  const field = (key: keyof Enquiry) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '');
  const enquiry = { name: field('name'), email: field('email'), phone: field('phone'), message: field('message') };
  if (!enquiry.name || !EMAIL_RE.test(enquiry.email) || !enquiry.message) return null;
  return enquiry;
}

// Emails an appointment request to the showroom, with the customer as reply-to.
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Email is not configured.' }, { status: 503 });
  }

  const enquiry = parse((await request.json().catch(() => ({}))) as Record<string, unknown>);
  if (!enquiry) {
    return NextResponse.json({ error: 'Name, a valid email address and a message are required.' }, { status: 400 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.APPOINTMENT_FROM ?? DEFAULT_FROM,
      to: [process.env.APPOINTMENT_TO ?? DEFAULT_TO],
      reply_to: enquiry.email,
      subject: `Appointment request from ${enquiry.name}`,
      text: [
        `Name: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        `Phone: ${enquiry.phone || '—'}`,
        '',
        enquiry.message,
      ].join('\n'),
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    console.error('[appointment] send failed:', res.status, body.message);
    return NextResponse.json({ error: body.message ?? `Email provider returned ${res.status}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
