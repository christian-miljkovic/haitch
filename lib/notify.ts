import type { Enquiry, EnquiryKind } from './shopify-admin';
import { STUDIO_EMAIL } from './studio';

// Staff alerts for form submissions, sent through Resend's REST API with plain
// `fetch` (no SDK), the same way lib/shopify-admin.ts talks to Shopify.
//
// Alerting is deliberately best-effort: the enquiry is already on the Shopify
// customer record before we get here, so a missing API key or a refused send
// must never fail the visitor's submission. Every failure logs and returns.

const ENDPOINT = 'https://api.resend.com/emails';

// Bounds the visitor's wait. Without it a hung connection holds the route open
// until the function's own timeout, turning an enquiry that is already safely
// recorded into a 504 — the failure this whole design exists to avoid.
const TIMEOUT_MS = 5_000;

// The domain verified in Resend, set by the Vercel Marketplace integration
// that provisioned the account. It is a subdomain (`send.haitch-usa.com`) so
// the root domain's Microsoft 365 mail flow and its `-all` SPF record stay
// untouched. Sending as anything else is refused, so the sender is derived
// from it rather than configured separately.
function sender(): string {
  return `HAITCH <alerts@${process.env.RESEND_EMAIL_DOMAIN || 'send.haitch-usa.com'}>`;
}

// The fallback is on the parsed result, not the raw string: a blank or
// comma-only ALERT_TO passes `||` and would send to nobody at all.
function recipients(): string[] {
  const configured = (process.env.ALERT_TO ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
  return configured.length ? configured : [STUDIO_EMAIL];
}

// Emails the studio about a submission, with the sender as reply-to so a reply
// goes straight back to them. Never throws: everything past the key check,
// including building the message, is inside the catch.
export async function alertStudio(kind: EnquiryKind, enquiry: Enquiry): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const lines = [`Name: ${enquiry.name}`, `Email: ${enquiry.email}`];
    if (enquiry.phone) lines.push(`Phone: ${enquiry.phone}`);
    lines.push('', enquiry.message.trim());

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender(),
        to: recipients(),
        reply_to: enquiry.email,
        // A submitted name may contain newlines; a subject header may not.
        subject: `${kind.label} — ${enquiry.name.replace(/\s+/g, ' ').trim()}`,
        text: lines.join('\n'),
      }),
    });
    if (!res.ok) {
      console.error(`[alert] ${kind.label} not sent (${res.status}): ${await res.text().catch(() => '')}`);
    }
  } catch (error) {
    console.error(`[alert] ${kind.label} not sent:`, error instanceof Error ? error.message : error);
  }
}
