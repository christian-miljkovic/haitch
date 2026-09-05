'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { GalleryImage } from '@/lib/gallery';
import styles from './GalleryStack.module.css';

type Props = {
  images: GalleryImage[];
  // Position of this tile in the gallery, for alt text and image priority.
  position: number;
};

// One gallery tile. A tile holding several similar frames cycles through them
// on tap with a crossfade; a single frame is a plain image.
export default function GalleryStack({ images, position }: Props) {
  const [current, setCurrent] = useState(0);
  const eager = position < 3;

  const frames = images.map((image, i) => (
    <Image
      key={image.src}
      src={image.src}
      alt={`HAITCH lookbook image ${position + 1}${images.length > 1 ? `, frame ${i + 1}` : ''}`}
      width={image.width}
      height={image.height}
      sizes="(max-width: 767px) 100vw, 33vw"
      className={`${styles.frame} ${i === current ? styles.current : ''}`}
      loading={eager && i === 0 ? 'eager' : undefined}
      aria-hidden={i !== current ? true : undefined}
    />
  ));

  if (images.length === 1) return <div className={styles.root}>{frames}</div>;

  return (
    <button
      type="button"
      className={`${styles.root} ${styles.stack}`}
      onClick={() => setCurrent((c) => (c + 1) % images.length)}
      aria-label={`Lookbook image ${position + 1}, frame ${current + 1} of ${images.length}. Show next frame`}
    >
      {frames}
      <span className={styles.counter} aria-hidden="true">
        {current + 1}
        <span className={styles.counterDivider} />
        {images.length}
      </span>
    </button>
  );
}
