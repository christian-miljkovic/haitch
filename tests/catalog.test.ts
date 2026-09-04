import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getProduct, getProducts } from '@/lib/catalog';
import looks from '@/lib/looks.json';

const publicDir = path.join(process.cwd(), 'public');

describe('catalog', () => {
  test('offers the twelve looks in line-sheet order: jackets, trousers, shirts', () => {
    expect(getProducts().map((p) => p.handle)).toEqual([
      'tuxedo-jacket-in-black-barathea',
      'black-plain-weave-jacket',
      'dark-navy-jacket-with-grey-pinstripe',
      'double-breasted-jacket-in-petrol-blue-gabardine',
      'tuxedo-trousers-in-black-barathea',
      'black-plain-weave-trousers',
      'grey-marle-pinstripe-trousers',
      'stone-grey-gabardine-trousers',
      'light-grey-cotton-trousers',
      'contrast-collar-shirt-in-silver-sateen',
      'contrast-collar-shirt-in-blue-stripe',
      'shirt-in-pink-stripe',
    ]);
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
