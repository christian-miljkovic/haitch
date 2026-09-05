import { describe, expect, test } from 'vitest';
import { GALLERY_IMAGES, GALLERY_STACKS } from '@/lib/gallery';
import { balanceColumns, stackImages } from '@/lib/gallery-layout';

const mixed = [
  { src: '/a.jpg', width: 4, height: 5, group: 1 },
  { src: '/b.jpg', width: 5, height: 4, group: 2 },
  { src: '/c.jpg', width: 4, height: 5, group: 3 },
  { src: '/d.jpg', width: 4, height: 5, group: 3 },
  { src: '/e.jpg', width: 5, height: 4, group: 4 },
  { src: '/f.jpg', width: 4, height: 5, group: 5 },
  { src: '/g.jpg', width: 4, height: 5, group: 5 },
];

// Column height in column-width units once every item is scaled by its column's factor.
function renderedHeight(column: { item: { width: number; height: number }; scale: number }[]) {
  return column.reduce((sum, { item, scale }) => sum + (item.height / item.width) * scale, 0);
}

describe('stacks of similar frames', () => {
  test('groups consecutive frames that share a group id, in order', () => {
    const stacks = stackImages(mixed);
    expect(stacks.map((s) => s.images.map((i) => i.src))).toEqual([
      ['/a.jpg'],
      ['/b.jpg'],
      ['/c.jpg', '/d.jpg'],
      ['/e.jpg'],
      ['/f.jpg', '/g.jpg'],
    ]);
  });

  test('a stack takes its size from its first frame', () => {
    const [, , cd] = stackImages(mixed);
    expect([cd.width, cd.height]).toEqual([4, 5]);
  });

  test('the real lookbook collapses into far fewer tiles with every frame kept', () => {
    expect(GALLERY_STACKS.length).toBeLessThan(GALLERY_IMAGES.length / 2);
    expect(GALLERY_STACKS.flatMap((s) => s.images)).toEqual(GALLERY_IMAGES);
  });
});

describe('balanced gallery columns', () => {
  test('places every item exactly once and keeps order inside each column', () => {
    const columns = balanceColumns(mixed, 3);
    expect(columns).toHaveLength(3);
    const placed = columns.flat().map((c) => c.index);
    expect([...placed].sort((a, b) => a - b)).toEqual(mixed.map((_, i) => i));
    for (const column of columns) {
      const indexes = column.map((c) => c.index);
      expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    }
  });

  test('every column ends on the same line after scaling', () => {
    const columns = balanceColumns(mixed, 3);
    const heights = columns.map(renderedHeight);
    for (const h of heights) expect(h).toBeCloseTo(heights[0], 6);
  });

  test('never enlarges and shrinks the real lookbook stacks by less than five percent', () => {
    const columns = balanceColumns(GALLERY_STACKS, 3);
    for (const { scale } of columns.flat()) {
      expect(scale).toBeLessThanOrEqual(1);
      expect(scale).toBeGreaterThan(0.95);
    }
    const heights = columns.map(renderedHeight);
    for (const h of heights) expect(h).toBeCloseTo(heights[0], 6);
  });

  test('a single column needs no scaling', () => {
    const columns = balanceColumns(mixed, 1);
    expect(columns).toHaveLength(1);
    expect(columns[0].every((c) => c.scale === 1)).toBe(true);
  });
});
