import { describe, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/components/CartContext';
import Nav from '@/components/Nav';
import BagDrawer from '@/components/BagDrawer';
import AddToCart from '@/components/AddToCart';
import { normalizeProducts } from '@/lib/shopify';
import fixture from '@/lib/fixtures/products.json';

vi.mock('next/navigation', () => ({
  usePathname: () => '/shop',
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

const products = normalizeProducts(fixture);
const jacket = products.find((p) => p.handle === 'white-track-jacket')!;
const shirt = products.find((p) => p.handle === 'bob-shirt-in-white-stripe')!;

function renderShop(product = jacket) {
  return render(
    <CartProvider>
      <Nav />
      <BagDrawer />
      <AddToCart product={product} />
    </CartProvider>
  );
}

describe('bag', () => {
  test('starts empty and adding an item opens the drawer with name, size and price', async () => {
    const user = userEvent.setup();
    renderShop();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bag \(0\)/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/size/i), 'M');
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getByText('WHITE TRACK JACKET')).toBeInTheDocument();
    expect(within(drawer).getByText('M')).toBeInTheDocument();
    expect(within(drawer).getAllByText(/\$\s?750/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /bag \(1\)/i })).toBeInTheDocument();
  });

  test('adding the same size twice increments quantity instead of duplicating the line', async () => {
    const user = userEvent.setup();
    renderShop();
    await user.selectOptions(screen.getByLabelText(/size/i), 'M');
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getAllByText('WHITE TRACK JACKET')).toHaveLength(1);
    expect(within(drawer).getByLabelText(/quantity/i)).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /bag \(2\)/i })).toBeInTheDocument();
  });

  test('quantity controls update the estimated total and remove clears the line', async () => {
    const user = userEvent.setup();
    renderShop();
    await user.selectOptions(screen.getByLabelText(/size/i), 'M');
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    const drawer = screen.getByRole('dialog');
    await user.click(within(drawer).getByRole('button', { name: /increase quantity/i }));
    expect(within(drawer).getByText(/\$\s?1,500/)).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: /decrease quantity/i }));
    expect(within(drawer).queryByText(/\$\s?1,500/)).not.toBeInTheDocument();
    expect(within(drawer).getAllByText(/\$\s?750/).length).toBeGreaterThan(0);

    await user.click(within(drawer).getByRole('button', { name: /remove/i }));
    expect(within(drawer).getByText(/your bag is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bag \(0\)/i })).toBeInTheDocument();
  });

  test('the bag survives a full remount (page navigation)', async () => {
    const user = userEvent.setup();
    const first = renderShop();
    await user.selectOptions(screen.getByLabelText(/size/i), 'L');
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    first.unmount();

    renderShop();
    expect(screen.getByRole('button', { name: /bag \(1\)/i })).toBeInTheDocument();
  });

  test('the drawer can be closed again', async () => {
    const user = userEvent.setup();
    renderShop();
    await user.selectOptions(screen.getByLabelText(/size/i), 'M');
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('sold-out sizes cannot be selected', () => {
    renderShop(shirt);
    const select = screen.getByLabelText(/size/i);
    expect(within(select).getByRole('option', { name: /^S\b/ })).toBeDisabled();
    expect(within(select).getByRole('option', { name: /^L\b/ })).toBeEnabled();
  });
});
