import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactPage from '@/app/contact/page';
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
});
