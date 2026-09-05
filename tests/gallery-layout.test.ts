import { describe, expect, test } from 'vitest';
import { GALLERY_IMAGES } from '@/lib/gallery';
import { balanceColumns } from '@/lib/gallery-layout';

const mixed = [
  { src: '/a.jpg', width: 4, height: 5 },
  { src: '/b.jpg', width: 5, height: 4 },
  { src: '/c.jpg', width: 4, height: 5 },
  { src: '/d.jpg', width: 4, height: 5 },
  { src: '/e.jpg', width: 5, height: 4 },
  { src: '/f.jpg', width: 4, height: 5 },
  { src: '/g.jpg', width: 4, height: 5 },
];

// Column height in column-width units once every image is scaled by its column's factor.
function renderedHeight(column: { image: { width: number; height: number }; scale: number }[]) {
  return column.reduce((sum, { image, scale }) => sum + (image.height / image.width) * scale, 0);
}

describe('balanced gallery columns', () => {
  test('places every image exactly once and keeps shoot order inside each column', () => {
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

  test('never enlarges and shrinks the real lookbook by less than three percent', () => {
    const columns = balanceColumns(GALLERY_IMAGES, 3);
    for (const { scale } of columns.flat()) {
      expect(scale).toBeLessThanOrEqual(1);
      expect(scale).toBeGreaterThan(0.97);
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
