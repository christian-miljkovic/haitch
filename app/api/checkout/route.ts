import { NextResponse } from 'next/server';
import type { CheckoutInfo } from '@/lib/checkout';
import { createDraftOrder, readConfig, type CheckoutLine } from '@/lib/shopify-admin';

type Body = { lines?: unknown; info?: unknown };

function parseLines(lines: unknown): CheckoutLine[] | null {
  if (!Array.isArray(lines) || lines.length === 0) return null;
  const parsed: CheckoutLine[] = [];
  for (const line of lines) {
    const variantId = Number((line as CheckoutLine)?.variantId);
    const quantity = Number((line as CheckoutLine)?.quantity);
    if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      return null;
    }
    parsed.push({ variantId, quantity });
  }
  return parsed;
}

// Starts a Shopify order for the bag and returns the hosted payment link.
export async function POST(request: Request) {
  const config = readConfig();
  if (!config) {
    return NextResponse.json({ error: 'Store is not configured for checkout.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const lines = parseLines(body.lines);
  const info = (body.info ?? {}) as CheckoutInfo;
  if (!lines || !info.email) {
    return NextResponse.json({ error: 'A bag and an email address are required.' }, { status: 400 });
  }

  try {
    const url = await createDraftOrder(config, lines, info);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[checkout] draft order failed:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
