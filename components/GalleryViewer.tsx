'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GalleryImage } from '@/lib/gallery';
import styles from './GalleryViewer.module.css';

type Props = {
  images: GalleryImage[];
  position: number;
  frame: number;
  onFrameChange: (frame: number) => void;
  onClose: () => void;
};

// Full-screen view of one tile's frames. Arrow keys and the side controls step
// through the frames; Escape or the close control returns to the gallery.
export default function GalleryViewer({ images, position, frame, onFrameChange, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;
  const step = (delta: number) => onFrameChange((frame + delta + count) % count);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (count > 1 && e.key === 'ArrowRight') step(1);
      if (count > 1 && e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  const image = images[frame];

  return createPortal(
    <div
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-label={`Lookbook image ${position + 1}${count > 1 ? `, frame ${frame + 1} of ${count}` : ''}`}
    >
      <button ref={closeRef} className={styles.close} onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className={styles.stage} onClick={() => (count > 1 ? step(1) : onClose())}>
        <Image
          key={image.src}
          src={image.src}
          alt={`HAITCH lookbook image ${position + 1}${count > 1 ? `, frame ${frame + 1}` : ''}`}
          width={image.width}
          height={image.height}
          sizes="100vw"
          className={styles.image}
          priority
        />
      </div>

      {count > 1 && (
        <>
          <button
            className={`${styles.arrow} ${styles.prev}`}
            onClick={() => step(-1)}
            aria-label="Previous frame"
          >
            ‹
          </button>
          <button className={`${styles.arrow} ${styles.next}`} onClick={() => step(1)} aria-label="Next frame">
            ›
          </button>
          <p className={styles.counter}>
            <span className="visually-hidden">Frame </span>
            {frame + 1}
            <span className={styles.counterDivider} aria-hidden="true" />
            <span className="visually-hidden">of </span>
            {count}
          </p>
        </>
      )}
    </div>,
    document.body
  );
}
