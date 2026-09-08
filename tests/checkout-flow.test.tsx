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

  test('payment step creates the Shopify order for the bag and sends the customer to pay', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ url: 'https://example.myshopify.com/invoices/abc' }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    try {
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

      await user.click(screen.getByRole('button', { name: /proceed to payment/i }));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe('/api/checkout');
      const body = JSON.parse(init.body as string);
      expect(body.lines).toEqual([{ variantId: mediumVariant.id, quantity: 1 }]);
      expect(body.info).toMatchObject({ email: 'harry@example.com', city: 'New York', zip: '10001' });
      await vi.waitFor(() => expect(assign).toHaveBeenCalledWith('https://example.myshopify.com/invoices/abc'));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test('tells the customer when the order could not be started', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'nope' }), { status: 502 })));
    try {
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
      await user.click(screen.getByRole('button', { name: /proceed to payment/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/could not start your order/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test('tells the customer when something in the bag has sold out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'One or more items in your bag are no longer available.' }), { status: 409 }))
    );
    try {
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
      await user.click(screen.getByRole('button', { name: /proceed to payment/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/no longer available/i);
      expect(screen.getByRole('button', { name: /proceed to payment/i })).toBeEnabled();
    } finally {
      vi.unstubAllGlobals();
    }
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

  test('shows a message under every required information field on an early continue', async () => {
    const user = await renderCheckoutWithItem();
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByLabelText(/email/i), 'nope');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(step(/information/i)).toHaveAttribute('aria-current', 'step');
    expect(screen.getByLabelText(/email/i)).toHaveAccessibleDescription(/valid email/i);
    expect(screen.getByLabelText(/first name/i)).toHaveAccessibleDescription(/enter your first name/i);
    expect(screen.getByLabelText(/last name/i)).toHaveAccessibleDescription(/enter your last name/i);
    expect(screen.getByLabelText(/phone/i)).not.toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByLabelText(/phone/i), '12');
    await user.tab();
    expect(screen.getByLabelText(/phone/i)).toHaveAccessibleDescription(/valid phone/i);
  });

  test('requires address, city, state and zip before shipping can continue', async () => {
    const user = await renderCheckoutWithItem();
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByLabelText(/email/i), 'harry@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'Harry');
    await user.type(screen.getByLabelText(/last name/i), 'Tillman');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(step(/shipping/i)).toHaveAttribute('aria-current', 'step');
    for (const [field, message] of [
      [/address$/i, /enter your address/i],
      [/city/i, /enter your city/i],
      [/state/i, /enter your state/i],
      [/zip/i, /enter your zip/i],
    ] as [RegExp, RegExp][]) {
      expect(screen.getByLabelText(field)).toHaveAccessibleDescription(message);
    }
    expect(screen.getByLabelText(/apt, suite/i)).not.toHaveAttribute('aria-invalid', 'true');
  });
});
