import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/lib/catalog';
import { makePurchasableProduct } from './helpers/products';

const products = getProducts();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tileFor = (handle: string) =>
  screen.getAllByRole('link').find((a) => a.getAttribute('href') === `/products/${handle}`)!;

describe('shop grid', () => {
  test('renders a tile per look linking to its product page', () => {
    render(<ProductGrid products={products} />);
    for (const p of products) {
      expect(tileFor(p.handle)).toHaveAccessibleName(new RegExp(escape(p.title), 'i'));
    }
  });

  test('tiles carry the look’s first two photos for the hover swap', () => {
    render(<ProductGrid products={products} />);
    const p = products.find((x) => x.handle === 'black-plain-weave-jacket')!;
    const tile = tileFor(p.handle);
    const imgs = Array.from(tile.querySelectorAll('img'));
    expect(imgs.length).toBe(2);
    const srcs = imgs.map((i) => decodeURIComponent(i.getAttribute('src') ?? ''));
    expect(srcs[0]).toContain(p.images[0]);
    expect(srcs[1]).toContain(p.images[1]);
    expect(imgs[0]).toHaveAccessibleName(/black plain weave jacket/i);
  });

  test('shows a price only when the product has one', () => {
    const priced = makePurchasableProduct();
    const unpriced = makePurchasableProduct({
      handle: 'test-look',
      title: 'TEST LOOK',
      price: undefined,
      variants: [],
    });
    render(<ProductGrid products={[priced, unpriced]} />);
    expect(within(tileFor(priced.handle)).getByText(/\$\s?750/)).toBeInTheDocument();
    expect(within(tileFor(unpriced.handle)).queryByText(/\$/)).not.toBeInTheDocument();
  });
});
