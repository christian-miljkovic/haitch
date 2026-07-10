import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { HERO_IMAGE, HERO_IMAGE_MOBILE } from '@/lib/gallery';

const file = (u: string) => u.split('?')[0].split('/').pop()!;

describe('landing hero', () => {
  test('serves the portrait campaign image to mobile viewports', () => {
    const { container } = render(<Home />);
    const source = container.querySelector('picture source[media*="max-width"]');
    expect(source).not.toBeNull();
    expect(decodeURIComponent(source!.getAttribute('srcset') ?? '')).toContain(
      file(HERO_IMAGE_MOBILE)
    );
  });

  test('keeps the landscape image for desktop and links to the shop', () => {
    const { container } = render(<Home />);
    const img = container.querySelector('picture img');
    expect(decodeURIComponent(img?.getAttribute('src') ?? '')).toContain(file(HERO_IMAGE));
    expect(screen.getByRole('link', { name: /shop the collection/i })).toHaveAttribute(
      'href',
      '/shop'
    );
  });
});
