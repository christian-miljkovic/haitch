import { beforeAll, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartProvider } from '@/components/CartContext';
import ProductPage from '@/app/products/[handle]/page';
import { getProduct } from '@/lib/catalog';
import { makePurchasableProduct } from './helpers/products';

vi.mock('next/navigation', () => ({
  usePathname: () => '/products/test',
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

// Inject one purchasable and one unpriced product alongside the real catalog
// so both states of the purchase panel can be exercised regardless of what
// the live catalog currently contains.
const UNPRICED = makePurchasableProduct({
  handle: 'test-look',
  title: 'TEST LOOK',
  price: undefined,
  variants: [],
});

vi.mock('@/lib/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/catalog')>();
  return {
    ...actual,
    getProduct: (handle: string) => {
      if (handle === 'test-jacket') return makePurchasableProduct();
      if (handle === 'test-look') return UNPRICED;
      return actual.getProduct(handle);
    },
  };
});

beforeAll(() => {
  // jsdom has no IntersectionObserver; the gallery counter needs a stand-in.
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', { value: IO, configurable: true });
});

async function renderPage(handle: string) {
  const ui = await ProductPage({ params: Promise.resolve({ handle }) });
  return render(<CartProvider>{ui}</CartProvider>);
}

describe('product page', () => {
  test('shows every photo of the look in the gallery', async () => {
    const tux = getProduct('tuxedo-jacket-in-black-barathea')!;
    await renderPage(tux.handle);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(tux.title);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(tux.images.length);
    expect(imgs[0]).toHaveAccessibleName(tux.title);
    expect(imgs[imgs.length - 1]).toHaveAccessibleName(`${tux.title}, view ${tux.images.length}`);
    const srcs = imgs.map((i) => decodeURIComponent(i.getAttribute('src') ?? ''));
    tux.images.forEach((img, i) => expect(srcs[i]).toContain(img));
  });

  test('shows the description, sizes and detail lists from the line sheet', async () => {
    const tux = getProduct('tuxedo-jacket-in-black-barathea')!;
    await renderPage(tux.handle);
    expect(screen.getByText(tux.description)).toBeInTheDocument();
    expect(screen.getByText(tux.sizes, { exact: false })).toBeInTheDocument();
    for (const group of tux.details) {
      expect(screen.getByRole('heading', { name: group.heading })).toBeInTheDocument();
      for (const item of group.items) {
        expect(screen.getByText(item)).toBeInTheDocument();
      }
    }
  });

  test('hides price and purchase controls while the look has no variants', async () => {
    await renderPage('test-look');
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart|sold out/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /book an appointment/i })).toHaveAttribute('href', '/appointment');
  });

  test('shows price and add-to-cart once a product has variants', async () => {
    await renderPage('test-jacket');
    expect(screen.getByText(/\$\s?750/)).toBeInTheDocument();
    expect(screen.getByLabelText(/size/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled();
  });

  test('404s for a handle that is not in the catalog', async () => {
    await expect(renderPage('not-a-look')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
