import type { Metadata } from 'next';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { GALLERY_IMAGES } from '@/lib/gallery';
import { balanceColumns } from '@/lib/gallery-layout';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Collections' };

const COLUMNS = 3;

export default function CollectionsPage() {
  const columns = balanceColumns(GALLERY_IMAGES, COLUMNS);
  return (
    <div className={styles.gallery}>
      {columns.map((column, c) => (
        <div key={c} className={styles.column}>
          {column.map(({ image, index, scale }) => (
            <div
              key={image.src}
              className={styles.item}
              style={
                {
                  order: index,
                  '--ratio': image.width / image.height,
                  '--scale': scale,
                } as CSSProperties
              }
            >
              <Image
                src={image.src}
                alt={`HAITCH lookbook image ${index + 1}`}
                width={image.width}
                height={image.height}
                sizes="(max-width: 767px) 100vw, 33vw"
                className={styles.image}
                loading={index < 3 ? 'eager' : undefined}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
