import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { HERO_IMAGE, HERO_IMAGE_MOBILE } from '@/lib/gallery';

const publicDir = path.join(process.cwd(), 'public');
const file = (u: string) => u.split('?')[0].split('/').pop()!;

describe('landing hero', () => {
  test('both hero photos are local files committed under public/', () => {
    for (const image of [HERO_IMAGE, HERO_IMAGE_MOBILE]) {
      expect(image.src).toMatch(/^\//);
      expect(fs.existsSync(path.join(publicDir, image.src)), `${image.src} missing`).toBe(true);
    }
    expect(HERO_IMAGE.width).toBeGreaterThan(HERO_IMAGE.height);
    expect(HERO_IMAGE_MOBILE.height).toBeGreaterThan(HERO_IMAGE_MOBILE.width);
  });

  test('serves the portrait photo to mobile viewports', () => {
    const { container } = render(<Home />);
    const source = container.querySelector('picture source[media*="max-width"]');
    expect(source).not.toBeNull();
    expect(decodeURIComponent(source!.getAttribute('srcset') ?? '')).toContain(
      file(HERO_IMAGE_MOBILE.src)
    );
  });

  test('keeps the landscape photo for desktop and links to the shop', () => {
    const { container } = render(<Home />);
    const img = container.querySelector('picture img');
    expect(decodeURIComponent(img?.getAttribute('src') ?? '')).toContain(file(HERO_IMAGE.src));
    expect(screen.getByRole('link', { name: /shop the collection/i })).toHaveAttribute(
      'href',
      '/shop'
    );
  });
});
