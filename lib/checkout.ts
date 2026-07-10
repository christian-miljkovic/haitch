export type CheckoutLine = { variantId: number; quantity: number };

export type CheckoutInfo = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
};

const STORE_URL = 'https://haitch-usa.com';

const PARAM_MAP: Record<keyof CheckoutInfo, string> = {
  email: 'checkout[email]',
  firstName: 'checkout[shipping_address][first_name]',
  lastName: 'checkout[shipping_address][last_name]',
  phone: 'checkout[shipping_address][phone]',
  address1: 'checkout[shipping_address][address1]',
  address2: 'checkout[shipping_address][address2]',
  city: 'checkout[shipping_address][city]',
  province: 'checkout[shipping_address][province]',
  zip: 'checkout[shipping_address][zip]',
  country: 'checkout[shipping_address][country]',
};

export function buildCheckoutUrl(lines: CheckoutLine[], info?: CheckoutInfo): string {
  const path = lines.map((l) => `${l.variantId}:${l.quantity}`).join(',');
  const params = new URLSearchParams();
  if (info) {
    for (const [key, param] of Object.entries(PARAM_MAP) as [keyof CheckoutInfo, string][]) {
      const value = info[key];
      if (value) params.set(param, value);
    }
  }
  const query = params.toString();
  return `${STORE_URL}/cart/${path}${query ? `?${query}` : ''}`;
}
