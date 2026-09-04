import { describe, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/components/CartContext';
import AddToCart from '@/components/AddToCart';
import CheckoutFlow from '@/components/CheckoutFlow';
import { makePurchasableProduct } from './helpers/products';

vi.mock('next/navigation', () => ({
  usePathname: () => '/checkout',
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

const jacket = makePurchasableProduct();
const mediumVariant = jacket.variants.find((v) => v.size === 'M')!;

async function renderCheckoutWithItem() {
  const user = userEvent.setup();
  render(
    <CartProvider>
      <AddToCart product={jacket} />
      <CheckoutFlow />
    </CartProvider>
  );
  await user.selectOptions(screen.getByLabelText(/size/i), 'M');
  await user.click(screen.getByRole('button', { name: /add to cart/i }));
  return user;
}

function step(name: RegExp) {
  const stepper = screen.getByRole('navigation', { name: /checkout steps/i });
  return within(stepper).getByText(name).closest('li')!;
}

describe('checkout flow', () => {
  test('shows all four steps with BAG current and the bag contents first', async () => {
    await renderCheckoutWithItem();
    for (const label of [/bag/i, /information/i, /shipping/i, /payment/i]) {
      expect(step(label)).toBeInTheDocument();
    }
    expect(step(/bag/i)).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('TEST JACKET')).toBeInTheDocument();
    expect(screen.getAllByText(/\$\s?750/).length).toBeGreaterThan(0);
  });

  test('each completed section advances the highlighted step', async () => {
    const user = await renderCheckoutWithItem();

    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(step(/information/i)).toHaveAttribute('aria-current', 'step');

    await user.type(screen.getByLabelText(/email/i), 'harry@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'Harry');
    await user.type(screen.getByLabelText(/last name/i), 'Tillman');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(step(/shipping/i)).toHaveAttribute('aria-current', 'step');

    await user.type(screen.getByLabelText(/address/i), '1 Savile Row');
    await user.type(screen.getByLabelText(/city/i), 'New York');
    await user.type(screen.getByLabelText(/state/i), 'NY');
    await user.type(screen.getByLabelText(/zip/i), '10001');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(step(/payment/i)).toHaveAttribute('aria-current', 'step');
  });

  test('cannot continue past information with an invalid email', async () => {
    const user = await renderCheckoutWithItem();
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByLabelText(/email/i), 'nope');
    await user.type(screen.getByLabelText(/first name/i), 'Harry');
    await user.type(screen.getByLabelText(/last name/i), 'Tillman');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(step(/information/i)).toHaveAttribute('aria-current', 'step');
  });

  test('payment step hands off to Shopify with bag lines and details prefilled', async () => {
    const user = await renderCheckoutWithItem();
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByLabelText(/email/i), 'harry@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'Harry');
    await user.type(screen.getByLabelText(/last name/i), 'Tillman');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByLabelText(/address/i), '1 Savile Row');
    await user.type(screen.getByLabelText(/city/i), 'New York');
    await user.type(screen.getByLabelText(/state/i), 'NY');
    await user.type(screen.getByLabelText(/zip/i), '10001');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    const pay = screen.getByRole('link', { name: /proceed to payment/i });
    const href = pay.getAttribute('href')!;
    expect(href).toContain(`haitch-usa.com/cart/${mediumVariant.id}:1`);
    const params = new URL(href).searchParams;
    expect(params.get('checkout[email]')).toBe('harry@example.com');
    expect(params.get('checkout[shipping_address][city]')).toBe('New York');
  });

  test('order summary shows the running total throughout', async () => {
    await renderCheckoutWithItem();
    const summary = screen.getByRole('complementary', { name: /order summary/i });
    expect(within(summary).getAllByText(/\$\s?750/).length).toBeGreaterThan(0);
  });

  test('an empty bag shows a return-to-shop state instead of the stepper', () => {
    render(
      <CartProvider>
        <CheckoutFlow />
      </CartProvider>
    );
    expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop/i })).toHaveAttribute('href', '/shop');
  });
});
