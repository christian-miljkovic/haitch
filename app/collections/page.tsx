import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import GalleryStack from '@/components/GalleryStack';
import { GALLERY_STACKS } from '@/lib/gallery';
import { balanceColumns } from '@/lib/gallery-layout';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Collections' };

const COLUMNS = 3;

export default function CollectionsPage() {
  const columns = balanceColumns(GALLERY_STACKS, COLUMNS);
  return (
    <div className={styles.gallery}>
      {columns.map((column, c) => (
        <div key={c} className={styles.column}>
          {column.map(({ item, index, scale }) => (
            <div
              key={item.images[0].src}
              className={styles.item}
              style={
                {
                  order: index,
                  '--ratio': item.width / item.height,
                  '--scale': scale,
                } as CSSProperties
              }
            >
              <GalleryStack images={item.images} position={index} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
