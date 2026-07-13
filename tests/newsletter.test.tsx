import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Footer from '@/components/Footer';

const fetchMock = vi.fn(() =>
  Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
);

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function openNewsletter() {
  const user = userEvent.setup();
  render(<Footer />);
  await user.click(screen.getByRole('button', { name: /newsletter/i }));
  return { user, dialog: screen.getByRole('dialog', { name: /newsletter/i }) };
}

describe('newsletter modal', () => {
  test('footer shows a newsletter trigger and no dialog until clicked', () => {
    render(<Footer />);
    expect(screen.getByRole('button', { name: /newsletter/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens a centered modal with an image and full name + email fields', async () => {
    const { dialog } = await openNewsletter();
    expect(within(dialog).getByRole('img')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/full name/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('does not submit with an invalid email', async () => {
    const { user, dialog } = await openNewsletter();
    await user.type(within(dialog).getByLabelText(/full name/i), 'Harry Tillman');
    await user.type(within(dialog).getByLabelText(/email/i), 'not-an-email');
    await user.click(within(dialog).getByRole('button', { name: /subscribe/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('submits name and email and shows the thank-you state', async () => {
    const { user, dialog } = await openNewsletter();
    await user.type(within(dialog).getByLabelText(/full name/i), 'Harry Tillman');
    await user.type(within(dialog).getByLabelText(/email/i), 'harry@example.com');
    await user.click(within(dialog).getByRole('button', { name: /subscribe/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('formspree.io');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ name: 'Harry Tillman', email: 'harry@example.com' });
    expect(await within(dialog).findByText(/thank you/i)).toBeInTheDocument();
  });

  test('the close button dismisses the modal', async () => {
    const { user } = await openNewsletter();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
