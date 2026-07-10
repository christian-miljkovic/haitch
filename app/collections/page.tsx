import type { Metadata } from 'next';
import Image from 'next/image';
import { GALLERY_IMAGES } from '@/lib/gallery';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Collections' };

export default function CollectionsPage() {
  return (
    <div className={styles.gallery}>
      {GALLERY_IMAGES.map((src, i) => (
        <div key={src} className={styles.item}>
          <Image
            src={src}
            alt={`HAITCH collection image ${i + 1}`}
            width={800}
            height={1000}
            sizes="(max-width: 767px) 100vw, 33vw"
            className={styles.image}
            priority={i < 3}
          />
        </div>
      ))}
    </div>
  );
}
