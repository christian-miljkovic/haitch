import { describe, expect, test } from 'vitest';
import { buildCheckoutUrl } from '@/lib/checkout';

describe('Shopify checkout permalink', () => {
  test('encodes every bag line as variantId:quantity on the store cart URL', () => {
    const url = buildCheckoutUrl([
      { variantId: 111, quantity: 1 },
      { variantId: 222, quantity: 3 },
    ]);
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://haitch-usa.com');
    expect(parsed.pathname).toBe('/cart/111:1,222:3');
  });

  test('prefills contact and shipping details for the hosted checkout', () => {
    const url = buildCheckoutUrl([{ variantId: 111, quantity: 2 }], {
      email: 'harry@example.com',
      firstName: 'Harry',
      lastName: 'Tillman',
      address1: '1 Savile Row',
      city: 'New York',
      province: 'NY',
      zip: '10001',
      country: 'United States',
    });
    const params = new URL(url).searchParams;
    expect(params.get('checkout[email]')).toBe('harry@example.com');
    expect(params.get('checkout[shipping_address][first_name]')).toBe('Harry');
    expect(params.get('checkout[shipping_address][last_name]')).toBe('Tillman');
    expect(params.get('checkout[shipping_address][address1]')).toBe('1 Savile Row');
    expect(params.get('checkout[shipping_address][city]')).toBe('New York');
    expect(params.get('checkout[shipping_address][zip]')).toBe('10001');
  });

  test('omits the query string entirely when no details are provided', () => {
    const url = buildCheckoutUrl([{ variantId: 5, quantity: 1 }]);
    expect(url).toBe('https://haitch-usa.com/cart/5:1');
  });
});
