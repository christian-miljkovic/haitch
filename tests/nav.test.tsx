import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/components/CartContext';
import Nav from '@/components/Nav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/shop',
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

function renderNav() {
  return render(
    <CartProvider>
      <Nav />
    </CartProvider>
  );
}

describe('mobile menu', () => {
  test('is an icon-only toggle with a spoken label instead of the word MENU', () => {
    renderNav();
    const toggle = screen.getByRole('button', { name: /open menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).not.toHaveTextContent(/menu|close/i);
    expect(screen.queryByText('MENU')).not.toBeInTheDocument();
  });

  test('opens the link list and turns into a close control', async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    const toggle = screen.getByRole('button', { name: /close menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: /book an appointment/i }).length).toBeGreaterThan(1);
  });

  test('closes again from the toggle', async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    await user.click(screen.getByRole('button', { name: /close menu/i }));
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
