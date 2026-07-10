import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentForm from '@/components/AppointmentForm';

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

describe('book an appointment form', () => {
  test('shows only the full name field first', () => {
    render(<AppointmentForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/message/i)).not.toBeInTheDocument();
  });

  test('advances one field at a time as each is completed', async () => {
    const user = userEvent.setup();
    render(<AppointmentForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Harry Tillman{Enter}');
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), 'harry@example.com{Enter}');
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/phone/i), '2125551234{Enter}');
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  test('does not advance past an empty name or an invalid email', async () => {
    const user = userEvent.setup();
    render(<AppointmentForm />);

    await user.type(screen.getByLabelText(/full name/i), '{Enter}');
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/full name/i), 'Harry{Enter}');
    await user.type(screen.getByLabelText(/email/i), 'not-an-email{Enter}');
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('submits all answers to Formspree and shows the thank-you state', async () => {
    const user = userEvent.setup();
    render(<AppointmentForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Harry Tillman{Enter}');
    await user.type(screen.getByLabelText(/email/i), 'harry@example.com{Enter}');
    await user.type(screen.getByLabelText(/phone/i), '2125551234{Enter}');
    await user.type(screen.getByLabelText(/message/i), 'Suit fitting please');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('formspree.io');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      name: 'Harry Tillman',
      email: 'harry@example.com',
      phone: '2125551234',
      message: 'Suit fitting please',
    });
    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
  });
});
