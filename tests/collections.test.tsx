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

  test('renders one image per lookbook shot at its true aspect ratio', () => {
    render(<CollectionsPage />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(GALLERY_IMAGES.length);
    GALLERY_IMAGES.forEach((g, i) => {
      expect(decodeURIComponent(imgs[i].getAttribute('src') ?? '')).toContain(g.src);
      expect(imgs[i]).toHaveAttribute('width', String(g.width));
      expect(imgs[i]).toHaveAttribute('height', String(g.height));
    });
  });
});
