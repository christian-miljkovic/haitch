import { describe, expect, test } from 'vitest';
import { normalizeProducts } from '@/lib/shopify';
import fixture from '@/lib/fixtures/products.json';

describe('catalog normalization from Shopify products.json', () => {
  const products = normalizeProducts(fixture);

  test('returns every product from the store', () => {
    expect(products.map((p) => p.handle).sort()).toEqual([
      'bob-shirt-in-white-stripe',
      'japanese-denim-jeans',
      'jet-black-beanie',
      'white-track-jacket',
    ]);
  });

  test('exposes title and numeric price for display', () => {
    const jacket = products.find((p) => p.handle === 'white-track-jacket')!;
    expect(jacket.title).toBe('WHITE TRACK JACKET');
    expect(jacket.price).toBe(750);
  });

  test('keeps all product images as absolute CDN URLs in order', () => {
    const jacket = products.find((p) => p.handle === 'white-track-jacket')!;
    const raw = fixture.products.find((p) => p.handle === 'white-track-jacket')!;
    expect(jacket.images.length).toBe(5);
    for (const src of jacket.images) {
      expect(src).toMatch(/^https:\/\/cdn\.shopify\.com\//);
    }
    expect(jacket.images[0]).toBe(raw.images[0].src);
    expect(jacket.images[4]).toBe(raw.images[4].src);
  });

  test('marks sold-out sizes as unavailable so they cannot be purchased', () => {
    const jeans = products.find((p) => p.handle === 'japanese-denim-jeans')!;
    const bySize = Object.fromEntries(jeans.variants.map((v) => [v.size, v.available]));
    expect(bySize['32']).toBe(false);
    expect(bySize['34']).toBe(false);
    expect(bySize['28']).toBe(true);
  });

  test('provides a readable description without raw HTML wrapper noise', () => {
    const jacket = products.find((p) => p.handle === 'white-track-jacket')!;
    expect(jacket.description).toContain('Track jacket in white Japanese cotton');
    expect(jacket.description).not.toContain('<p');
  });
});
