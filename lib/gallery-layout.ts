import type { GalleryImage } from './gallery';

export type PlacedImage = {
  image: GalleryImage;
  // Position in the source list, so a single-column layout can restore shoot order.
  index: number;
  // Uniform height factor for the column (≤ 1) that makes every column end on the same line.
  scale: number;
};

// Distributes images into `count` columns, each new image going to the
// currently shortest column, then scales each column down to the shortest one
// so all columns share the same height. Heights are measured in column-width
// units, so the result holds for any column width.
export function balanceColumns(images: GalleryImage[], count: number): PlacedImage[][] {
  const columns: { index: number; image: GalleryImage }[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);

  images.forEach((image, index) => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push({ image, index });
    heights[shortest] += image.height / image.width;
  });

  const target = Math.min(...heights.filter((h) => h > 0));
  return columns.map((column, i) => {
    const scale = heights[i] > 0 ? target / heights[i] : 1;
    return column.map((placed) => ({ ...placed, scale }));
  });
}
