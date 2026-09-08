import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollectionsPage from '@/app/collections/page';
import SeasonPage from '@/app/collections/[season]/page';
import { CURRENT_SEASON, GALLERY_IMAGES, GALLERY_STACKS, SEASONS } from '@/lib/gallery';

const publicDir = path.join(process.cwd(), 'public');
const file = (src: string | null) => decodeURIComponent(src ?? '').match(/lookbook(?:-season-\d)?(?:%2F|\/)(\d+)/)?.[1];

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

  test('every tile is clickable: a lone frame opens the full-screen viewer on that photo', async () => {
    const user = userEvent.setup();
    render(<CollectionsPage />);
    const stackIndex = GALLERY_STACKS.findIndex((s) => s.images.length === 1);
    const single = GALLERY_STACKS[stackIndex];
    const tile = screen.getByRole('button', { name: new RegExp(`^Lookbook image ${stackIndex + 1}\\b.*view full screen`, 'i') });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(tile);
    const viewer = screen.getByRole('dialog', { name: /lookbook/i });
    expect(file(within(viewer).getByRole('img').getAttribute('src'))).toBe(file(single.images[0].src));
    expect(within(viewer).queryByRole('button', { name: /next/i })).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('a stacked tile can be expanded and stepped through full screen', async () => {
    const user = userEvent.setup();
    render(<CollectionsPage />);
    const stackIndex = GALLERY_STACKS.findIndex((s) => s.images.length > 2);
    const stack = GALLERY_STACKS[stackIndex];
    await user.click(screen.getByRole('button', { name: new RegExp(`^View lookbook image ${stackIndex + 1} full screen`, 'i') }));

    const viewer = screen.getByRole('dialog', { name: /lookbook/i });
    const shown = () => file(within(viewer).getByRole('img').getAttribute('src'));
    expect(shown()).toBe(file(stack.images[0].src));
    expect(viewer).toHaveAccessibleName(new RegExp(`frame 1 of ${stack.images.length}`, 'i'));

    await user.click(within(viewer).getByRole('button', { name: /next/i }));
    expect(shown()).toBe(file(stack.images[1].src));

    await user.keyboard('{ArrowLeft}');
    expect(shown()).toBe(file(stack.images[0].src));
    await user.keyboard('{ArrowLeft}');
    expect(shown()).toBe(file(stack.images[stack.images.length - 1].src));

    await user.click(within(viewer).getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('every season’s photos exist on disk and no season is empty', () => {
    expect(SEASONS.map((s) => s.slug)).toEqual(['season-1', 'season-2']);
    expect(CURRENT_SEASON.slug).toBe('season-2');
    for (const season of SEASONS) {
      expect(season.stacks.length).toBeGreaterThan(0);
      for (const image of season.stacks.flatMap((s) => s.images)) {
        expect(fs.existsSync(path.join(publicDir, image.src)), `${image.src} missing`).toBe(true);
      }
    }
  });

  test('the collections page opens on Season 2 with a tab to Season 1', () => {
    render(<CollectionsPage />);
    const tabs = screen.getByRole('navigation', { name: /seasons/i });
    expect(within(tabs).getAllByRole('link').map((a) => a.textContent)).toEqual(['SEASON 1', 'SEASON 2']);
    const current = within(tabs).getByRole('link', { name: /season 2/i });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: /season 1/i })).toHaveAttribute('href', '/collections/season-1');
    expect(screen.getAllByRole('img')).toHaveLength(GALLERY_STACKS.length);
  });

  test('the Season 1 route shows the previous collection with the same tile behaviour', async () => {
    const season1 = SEASONS.find((s) => s.slug === 'season-1')!;
    const ui = await SeasonPage({ params: Promise.resolve({ season: 'season-1' }) });
    render(ui);
    const tabs = screen.getByRole('navigation', { name: /seasons/i });
    expect(within(tabs).getByRole('link', { name: /season 1/i })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: /season 2/i })).toHaveAttribute('href', '/collections');
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(season1.stacks.length);
    expect(file(imgs[0].getAttribute('src'))).toBe(file(season1.stacks[0].images[0].src));
  });
});
