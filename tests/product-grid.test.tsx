import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ProductGrid from '@/components/ProductGrid';
import { normalizeProducts } from '@/lib/shopify';
import fixture from '@/lib/fixtures/products.json';

const products = normalizeProducts(fixture);

describe('shop grid', () => {
  test('renders a tile per product linking to its product page', () => {
    render(<ProductGrid products={products} />);
    for (const p of products) {
      const tile = screen.getByRole('link', { name: new RegExp(p.title, 'i') });
      expect(tile).toHaveAttribute('href', `/products/${p.handle}`);
    }
  });

  test('every tile shows the product name and price', () => {
    render(<ProductGrid products={products} />);
    const jacket = screen.getByRole('link', { name: /white track jacket/i });
    expect(within(jacket).getByText('WHITE TRACK JACKET')).toBeInTheDocument();
    expect(within(jacket).getByText(/\$\s?750/)).toBeInTheDocument();
    const beanie = screen.getByRole('link', { name: /jet-black beanie/i });
    expect(within(beanie).getByText(/\$\s?110/)).toBeInTheDocument();
  });

  test('tiles carry the product’s first two images for the hover swap', () => {
    render(<ProductGrid products={products} />);
    const p = products.find((x) => x.handle === 'white-track-jacket')!;
    const tile = screen.getByRole('link', { name: /white track jacket/i });
    const imgs = Array.from(tile.querySelectorAll('img'));
    expect(imgs.length).toBe(2);
    const file = (u: string) => u.split('?')[0].split('/').pop()!;
    const srcs = imgs.map((i) => decodeURIComponent(i.getAttribute('src') ?? ''));
    expect(srcs[0]).toContain(file(p.images[0]));
    expect(srcs[1]).toContain(file(p.images[1]));
    expect(imgs[0]).toHaveAccessibleName(/white track jacket/i);
  });
});
