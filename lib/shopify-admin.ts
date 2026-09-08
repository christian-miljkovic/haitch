import type { CheckoutInfo } from './checkout';

// Server-side access to the Shopify Admin API using the client credentials
// grant of the store's own Dev Dashboard app. Import only from route handlers
// or server components: the client secret must never reach the browser.

const API_VERSION = '2026-07';

type Config = { domain: string; clientId: string; clientSecret: string };

export function readConfig(): Config | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  return domain && clientId && clientSecret ? { domain, clientId, clientSecret } : null;
}

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(config: Config): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const res = await fetch(`https://${config.domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!res.ok || !body.access_token) {
    throw new Error(`Shopify token exchange failed (${res.status}): ${JSON.stringify(body)}`);
  }
  cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return cached.token;
}

async function adminGraphql<T>(config: Config, query: string, variables: unknown): Promise<T> {
  const token = await accessToken(config);
  const res = await fetch(`https://${config.domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as { data?: T; errors?: unknown };
  if (!res.ok || body.errors || !body.data) {
    throw new Error(`Shopify request failed (${res.status}): ${JSON.stringify(body.errors ?? body)}`);
  }
  return body.data;
}

const DRAFT_ORDER_CREATE = `
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder { id invoiceUrl }
      userErrors { field message }
    }
  }
`;

type DraftOrderResult = {
  draftOrderCreate: {
    draftOrder: { id: string; invoiceUrl: string } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

export type CheckoutLine = { variantId: number; quantity: number };

export class ShopifyUserError extends Error {}

// Creates a draft order for the bag and returns Shopify's hosted payment link.
// Draft orders can be paid even for products not published to the Online Store.
export async function createDraftOrder(
  config: Config,
  lines: CheckoutLine[],
  info: CheckoutInfo
): Promise<string> {
  const province = info.province?.trim() ?? '';
  const data = await adminGraphql<DraftOrderResult>(config, DRAFT_ORDER_CREATE, {
    input: {
      email: info.email,
      lineItems: lines.map((l) => ({
        variantId: `gid://shopify/ProductVariant/${l.variantId}`,
        quantity: l.quantity,
      })),
      shippingAddress: {
        firstName: info.firstName,
        lastName: info.lastName,
        phone: info.phone || undefined,
        address1: info.address1,
        address2: info.address2 || undefined,
        city: info.city,
        ...(province.length === 2 ? { provinceCode: province.toUpperCase() } : { province }),
        zip: info.zip,
        countryCode: 'US',
      },
      useCustomerDefaultAddress: false,
    },
  });
  const { draftOrder, userErrors } = data.draftOrderCreate;
  if (userErrors.length || !draftOrder) {
    throw new ShopifyUserError(userErrors.map((e) => e.message).join('; ') || 'Draft order not created');
  }
  return draftOrder.invoiceUrl;
}

const CUSTOMER_BY_EMAIL = `
  query CustomerByEmail($query: String!) {
    customers(first: 1, query: $query) { nodes { id note } }
  }
`;

const CUSTOMER_UPDATE = `
  mutation CustomerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

const TAGS_ADD = `
  mutation TagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      node { id }
      userErrors { field message }
    }
  }
`;

const CUSTOMER_CREATE = `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

const CONSENT_UPDATE = `
  mutation ConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

type UserErrors = { field: string[] | null; message: string }[];

function assertNoErrors(userErrors: UserErrors, fallback: string) {
  if (userErrors.length) throw new ShopifyUserError(userErrors.map((e) => e.message).join('; ') || fallback);
}

const consent = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' };

type CustomerRef = { id: string; note: string | null };

async function findCustomer(config: Config, email: string): Promise<CustomerRef | undefined> {
  const data = await adminGraphql<{ customers: { nodes: CustomerRef[] } }>(config, CUSTOMER_BY_EMAIL, {
    query: `email:${JSON.stringify(email)}`,
  });
  return data.customers.nodes[0];
}

function splitName(name: string): { firstName: string; lastName: string | undefined } {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') || undefined };
}

// Subscribes an email address to marketing: creates the customer, or updates
// consent when the address already belongs to one.
export async function subscribeToNewsletter(config: Config, name: string, email: string): Promise<void> {
  const { firstName, lastName } = splitName(name);

  const customerId = (await findCustomer(config, email))?.id;

  if (customerId) {
    const data = await adminGraphql<{ customerEmailMarketingConsentUpdate: { userErrors: UserErrors } }>(
      config,
      CONSENT_UPDATE,
      { input: { customerId, emailMarketingConsent: consent } }
    );
    assertNoErrors(data.customerEmailMarketingConsentUpdate.userErrors, 'Subscription not updated');
    return;
  }

  const data = await adminGraphql<{ customerCreate: { customer: { id: string } | null; userErrors: UserErrors } }>(
    config,
    CUSTOMER_CREATE,
    { input: { email, firstName, lastName, emailMarketingConsent: consent } }
  );
  assertNoErrors(data.customerCreate.userErrors, 'Customer not created');
}

export type AppointmentRequest = { name: string; email: string; phone: string; message: string };

export const APPOINTMENT_TAG = 'appointment-request';

// Files an appointment request against the customer's Shopify record: the
// message (with phone and time) goes into the customer note and the record is
// tagged so requests can be filtered in the admin. No marketing consent is set.
export async function recordAppointmentRequest(
  config: Config,
  enquiry: AppointmentRequest,
  now: Date = new Date()
): Promise<void> {
  const stamp = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const entry = [
    `Appointment request — ${stamp}`,
    `Phone: ${enquiry.phone || '—'}`,
    '',
    enquiry.message.trim(),
  ].join('\n');

  const existing = await findCustomer(config, enquiry.email);

  if (existing) {
    const note = existing.note ? `${existing.note}\n\n${entry}` : entry;
    const updated = await adminGraphql<{ customerUpdate: { userErrors: UserErrors } }>(config, CUSTOMER_UPDATE, {
      input: { id: existing.id, note },
    });
    assertNoErrors(updated.customerUpdate.userErrors, 'Customer note not updated');
    const tagged = await adminGraphql<{ tagsAdd: { userErrors: UserErrors } }>(config, TAGS_ADD, {
      id: existing.id,
      tags: [APPOINTMENT_TAG],
    });
    assertNoErrors(tagged.tagsAdd.userErrors, 'Customer not tagged');
    return;
  }

  const { firstName, lastName } = splitName(enquiry.name);
  const created = await adminGraphql<{ customerCreate: { customer: { id: string } | null; userErrors: UserErrors } }>(
    config,
    CUSTOMER_CREATE,
    { input: { email: enquiry.email, firstName, lastName, note: entry, tags: [APPOINTMENT_TAG] } }
  );
  assertNoErrors(created.customerCreate.userErrors, 'Customer not created');
}
