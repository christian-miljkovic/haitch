import type { Metadata } from 'next';
import Image from 'next/image';
import { GALLERY_IMAGES } from '@/lib/gallery';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Collections' };

export default function CollectionsPage() {
  return (
    <div className={styles.gallery}>
      {GALLERY_IMAGES.map((image, i) => (
        <div key={image.src} className={styles.item}>
          <Image
            src={image.src}
            alt={`HAITCH lookbook image ${i + 1}`}
            width={image.width}
            height={image.height}
            sizes="(max-width: 767px) 100vw, 33vw"
            className={styles.image}
            loading={i < 3 ? 'eager' : undefined}
          />
        </div>
      ))}
    </div>
  );
}
