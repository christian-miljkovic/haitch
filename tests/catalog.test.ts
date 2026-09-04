import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getProduct, getProducts } from '@/lib/catalog';
import looks from '@/lib/looks.json';

const publicDir = path.join(process.cwd(), 'public');

describe('catalog', () => {
  test('offers the twelve looks in look order with unique handles', () => {
    const products = getProducts();
    expect(products).toHaveLength(12);
    expect(new Set(products.map((p) => p.handle)).size).toBe(12);
    // Look 1 is the blue stripe shirt, Look 12 the stone grey trousers.
    expect(products[0].title).toBe('CONTRAST COLLAR SHIRT IN BLUE STRIPE');
    expect(products[11].title).toBe('STONE GREY GABARDINE TROUSERS');
  });

  test('every image referenced by a product exists on disk under public/', () => {
    for (const p of getProducts()) {
      expect(p.images.length, `${p.handle} needs at least two images for the grid hover`).toBeGreaterThanOrEqual(2);
      for (const img of p.images) {
        expect(img).toMatch(/^\//);
        expect(fs.existsSync(path.join(publicDir, img)), `${img} missing`).toBe(true);
      }
    }
  });

  test('looks up a product by its handle with all of its photos', () => {
    const tux = getProduct('tuxedo-jacket-in-black-barathea');
    expect(tux?.title).toBe('TUXEDO JACKET IN BLACK BARATHEA');
    expect(tux?.images).toEqual(looks.looks.find((l) => l.look === 11)!.images);
    expect(tux?.description).toMatch(/British worsted barathea/);
    expect(tux?.sizes).toBe('44, 46, 48, 50, 52, 54, 56, 58 EU');
    expect(tux?.details.flatMap((d) => d.items)).toContain('Satin-covered buttons');
  });

  test('returns undefined for an unknown handle', () => {
    expect(getProduct('not-a-look')).toBeUndefined();
  });
});
