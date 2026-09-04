import type { Product } from '@/lib/product';

// A complete, realistic purchasable product for cart and checkout tests.
// Sizes mirror the label's shirt sizing; S is sold out so tests can cover
// the disabled-variant path.
export function makePurchasableProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 9001,
    handle: 'test-jacket',
    title: 'TEST JACKET',
    description: 'Single-breasted tailored jacket. Made to order. 5-6 week production time.',
    price: 750,
    images: ['/looks/look-8/01.jpg', '/looks/look-8/02.jpg'],
    sizes: 'XS, S, M, L, XL, XXL',
    details: [],
    variants: [
      { id: 1, size: 'XS', price: 750, available: true },
      { id: 2, size: 'S', price: 750, available: false },
      { id: 3, size: 'M', price: 750, available: true },
      { id: 4, size: 'L', price: 750, available: true },
      { id: 5, size: 'XL', price: 750, available: true },
      { id: 6, size: 'XXL', price: 750, available: true },
    ],
    ...overrides,
  };
}
