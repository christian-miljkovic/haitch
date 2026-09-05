import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollectionsPage from '@/app/collections/page';
import { GALLERY_IMAGES, GALLERY_STACKS } from '@/lib/gallery';

const publicDir = path.join(process.cwd(), 'public');
const file = (src: string | null) => decodeURIComponent(src ?? '').match(/lookbook(?:%2F|\/)(\d+)/)?.[1];

describe('collections gallery', () => {
  test('every lookbook image exists on disk and no frame is repeated', () => {
    expect(GALLERY_IMAGES.length).toBeGreaterThan(0);
    const srcs = GALLERY_IMAGES.map((g) => g.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    for (const g of GALLERY_IMAGES) {
      expect(fs.existsSync(path.join(publicDir, g.src)), `${g.src} missing`).toBe(true);
    }
  });

  test('shows one tile per stack, each opening on its first frame', () => {
    render(<CollectionsPage />);
    const visible = screen.getAllByRole('img');
    expect(visible).toHaveLength(GALLERY_STACKS.length);
    const shown = new Set(visible.map((img) => file(img.getAttribute('src'))));
    for (const stack of GALLERY_STACKS) {
      expect(shown.has(file(stack.images[0].src)), `${stack.images[0].src} not shown`).toBe(true);
    }
  });

  test('tapping a stacked tile advances to the next similar frame and wraps around', async () => {
    const user = userEvent.setup();
    render(<CollectionsPage />);
    const stack = GALLERY_STACKS.find((s) => s.images.length > 2)!;
    const tile = screen
      .getAllByRole('button', { name: new RegExp(`1 of ${stack.images.length}`) })
      .find((b) => file(within(b).getByRole('img').getAttribute('src')) === file(stack.images[0].src))!;
    expect(file(within(tile).getByRole('img').getAttribute('src'))).toBe(file(stack.images[0].src));

    await user.click(tile);
    expect(tile).toHaveAccessibleName(new RegExp(`2 of ${stack.images.length}`));
    expect(file(within(tile).getByRole('img').getAttribute('src'))).toBe(file(stack.images[1].src));

    for (let i = 1; i < stack.images.length; i++) await user.click(tile);
    expect(tile).toHaveAccessibleName(new RegExp(`1 of ${stack.images.length}`));
    expect(file(within(tile).getByRole('img').getAttribute('src'))).toBe(file(stack.images[0].src));
  });

  test('single-frame tiles are not buttons', () => {
    render(<CollectionsPage />);
    const singles = GALLERY_STACKS.filter((s) => s.images.length === 1).length;
    const stacked = GALLERY_STACKS.length - singles;
    expect(screen.getAllByRole('button')).toHaveLength(stacked);
  });
});
