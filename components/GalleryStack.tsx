'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { GalleryImage } from '@/lib/gallery';
import styles from './GalleryStack.module.css';

type Props = {
  images: GalleryImage[];
  // Position of this tile in the gallery, for alt text, image priority and the reveal cascade.
  position: number;
  // Called with the frame to show when the tile is opened full screen.
  onOpen: (frame: number) => void;
};

// One gallery tile. It rises into view as it scrolls onto the screen. A lone
// frame opens full screen on click; a tile holding several similar frames
// cycles through them on click with a crossfade and offers a separate control
// to open the current frame full screen.
export default function GalleryStack({ images, position, onOpen }: Props) {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const eager = position < 3;
  const stacked = images.length > 1;

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

  const label = `Lookbook image ${position + 1}`;

  return (
    <div
      ref={ref}
      className={`${styles.root} ${revealed ? styles.revealed : ''}`}
      style={{ transitionDelay: `${(position % 3) * 90}ms` }}
    >
      <button
        type="button"
        className={styles.tile}
        onClick={() => (stacked ? setCurrent((c) => (c + 1) % images.length) : onOpen(0))}
        aria-label={
          stacked
            ? `${label}, frame ${current + 1} of ${images.length}. Show next frame`
            : `${label}. View full screen`
        }
      >
        {images.map((image, i) => (
          <Image
            key={image.src}
            src={image.src}
            alt={`HAITCH lookbook image ${position + 1}${stacked ? `, frame ${i + 1}` : ''}`}
            width={image.width}
            height={image.height}
            sizes="(max-width: 767px) 100vw, 33vw"
            className={`${styles.frame} ${i === current ? styles.current : ''}`}
            loading={eager && i === 0 ? 'eager' : undefined}
            aria-hidden={i !== current ? true : undefined}
          />
        ))}
      </button>

      {stacked && (
        <>
          <span className={styles.counter} aria-hidden="true">
            {current + 1}
            <span className={styles.counterDivider} />
            {images.length}
          </span>
          <button
            type="button"
            className={styles.expand}
            onClick={() => onOpen(current)}
            aria-label={`View lookbook image ${position + 1} full screen`}
          >
            <span className={styles.expandIcon} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
