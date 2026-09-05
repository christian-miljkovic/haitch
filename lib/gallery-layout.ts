import type { GalleryImage } from './gallery';

export type Sized = { width: number; height: number };

// Similar frames from the same set, shown as one tile that cycles on tap.
export type GalleryStack = Sized & { images: GalleryImage[] };

export type Placed<T extends Sized> = {
  item: T;
  // Position in the source list, so a single-column layout can restore order.
  index: number;
  // Uniform height factor for the column (≤ 1) that makes every column end on the same line.
  scale: number;
};

// Consecutive images sharing a manifest `group` become one stack sized by its first frame.
export function stackImages(images: GalleryImage[]): GalleryStack[] {
  const stacks: GalleryStack[] = [];
  for (const image of images) {
    const last = stacks[stacks.length - 1];
    if (last && last.images[0].group === image.group) last.images.push(image);
    else stacks.push({ width: image.width, height: image.height, images: [image] });
  }
  return stacks;
}

// Distributes items into `count` columns, each new item going to the
// currently shortest column, then scales each column down to the shortest one
// so all columns share the same height. Heights are measured in column-width
// units, so the result holds for any column width.
export function balanceColumns<T extends Sized>(items: T[], count: number): Placed<T>[][] {
  const columns: { index: number; item: T }[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);

  items.forEach((item, index) => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push({ item, index });
    heights[shortest] += item.height / item.width;
  });

  const target = Math.min(...heights.filter((h) => h > 0));
  return columns.map((column, i) => {
    const scale = heights[i] > 0 ? target / heights[i] : 1;
    return column.map((placed) => ({ ...placed, scale }));
  });
}
