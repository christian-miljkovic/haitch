import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactPage from '@/app/contact/page';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';

describe('contact page', () => {
  test('lists the general and press email addresses as mail links', () => {
    render(<ContactPage />);
    const general = screen.getByRole('link', { name: /info@haitch-usa\.com/i });
    expect(general).toHaveAttribute('href', 'mailto:info@haitch-usa.com');
    const press = screen.getByRole('link', { name: /press@haitch-usa\.com/i });
    expect(press).toHaveAttribute('href', 'mailto:press@haitch-usa.com');
  });

  test('links to Instagram and to booking an appointment', () => {
    render(<ContactPage />);
    expect(screen.getByRole('link', { name: /@haitch\.usa/i })).toHaveAttribute(
      'href',
      'https://www.instagram.com/haitch.usa'
    );
    expect(screen.getByRole('link', { name: /book an appointment/i })).toHaveAttribute(
      'href',
      '/appointment'
    );
  });

  test('the footer CONTACT link navigates to the contact page', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /^contact$/i })).toHaveAttribute('href', '/contact');
  });

  test('offers a message form alongside the addresses, for people who would rather not open mail', () => {
    render(<ContactPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });
});

describe('get in touch form', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('sends the enquiry to the contact route and confirms it was received', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Dara Okafor');
    await user.type(screen.getByLabelText(/^email$/i), 'dara@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Do you ship the overcoat to Lisbon?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toMatchObject({
      name: 'Dara Okafor',
      email: 'dara@example.com',
      message: 'Do you ship the overcoat to Lisbon?',
    });

    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/message/i)).not.toBeInTheDocument();
  });

  test('explains what is wrong under each field instead of posting an incomplete enquiry', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/full name/i)).toHaveAccessibleDescription(/enter your full name/i);
    expect(screen.getByLabelText(/^email$/i)).toHaveAccessibleDescription(/valid email/i);
    expect(screen.getByLabelText(/message/i)).toHaveAccessibleDescription(/enter a message/i);
  });

  test('refuses a malformed email address', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Dara Okafor');
    await user.type(screen.getByLabelText(/^email$/i), 'dara@');
    await user.type(screen.getByLabelText(/message/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^email$/i)).toHaveAccessibleDescription(/valid email/i);
  });

  test('will not post a second time while the first is still in flight', async () => {
    let release: (res: Response) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => (release = resolve)));

    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText(/full name/i), 'Dara Okafor');
    await user.type(screen.getByLabelText(/^email$/i), 'dara@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello');

    const send = screen.getByRole('button', { name: /send/i });
    await user.click(send);
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /sending/i }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    release(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
  });

  test('flags an invalid field when it loses focus', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(screen.getByLabelText(/full name/i));
    await user.tab();
    expect(screen.getByLabelText(/full name/i)).toHaveAccessibleDescription(/enter your full name/i);
  });

  test('tells the sender to email instead when the route rejects the enquiry', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 502 }));
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Dara Okafor');
    await user.type(screen.getByLabelText(/^email$/i), 'dara@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /send/i }));

    const notice = await screen.findByText(/something went wrong/i);
    expect(notice).toHaveAttribute('role', 'alert');
    expect(notice).toHaveTextContent(/info@haitch-usa\.com/i);
  });
});
