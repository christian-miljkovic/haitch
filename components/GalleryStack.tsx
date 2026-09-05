'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { GalleryImage } from '@/lib/gallery';
import styles from './GalleryStack.module.css';

type Props = {
  images: GalleryImage[];
  // Position of this tile in the gallery, for alt text, image priority and the reveal cascade.
  position: number;
};

// One gallery tile. It rises into view as it scrolls onto the screen; a tile
// holding several similar frames cycles through them on tap with a crossfade,
// while a single frame is a plain image.
export default function GalleryStack({ images, position }: Props) {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const eager = position < 3;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const className = `${styles.root} ${revealed ? styles.revealed : ''}`;
  const style = { transitionDelay: `${(position % 3) * 90}ms` };

  if (images.length === 1) {
    return (
      <div ref={ref as React.RefObject<HTMLDivElement>} className={className} style={style}>
        {frames}
      </div>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={`${className} ${styles.stack}`}
      style={style}
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
