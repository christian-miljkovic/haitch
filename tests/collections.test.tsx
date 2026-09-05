import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import CollectionsPage from '@/app/collections/page';
import { GALLERY_IMAGES } from '@/lib/gallery';

const publicDir = path.join(process.cwd(), 'public');

describe('collections gallery', () => {
  test('every lookbook image exists on disk and no frame is repeated', () => {
    expect(GALLERY_IMAGES.length).toBeGreaterThan(0);
    const srcs = GALLERY_IMAGES.map((g) => g.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    for (const g of GALLERY_IMAGES) {
      expect(fs.existsSync(path.join(publicDir, g.src)), `${g.src} missing`).toBe(true);
    }
  });

  test('renders every lookbook shot once with its true dimensions', () => {
    render(<CollectionsPage />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(GALLERY_IMAGES.length);
    const bySrc = new Map(
      imgs.map((img) => [decodeURIComponent(img.getAttribute('src') ?? ''), img] as const)
    );
    for (const g of GALLERY_IMAGES) {
      const img = [...bySrc.entries()].find(([src]) => src.includes(g.src))?.[1];
      expect(img, `${g.src} not rendered`).toBeDefined();
      expect(img).toHaveAttribute('width', String(g.width));
      expect(img).toHaveAttribute('height', String(g.height));
    }
  });
});
