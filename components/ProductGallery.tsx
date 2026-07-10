'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './ProductGallery.module.css';

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(1);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = refs.current.indexOf(entry.target as HTMLDivElement);
            if (index >= 0) setCurrent(index + 1);
          }
        }
      },
      { threshold: 0.55 }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [images]);

  return (
    <div className={styles.root}>
      <p className={styles.counter}>
        <span className="visually-hidden">Image </span>
        <span>{current}</span>
        <span className={styles.counterDivider} aria-hidden="true" />
        <span className="visually-hidden">of </span>
        <span>{images.length}</span>
      </p>
      <div className={styles.track}>
        {images.map((src, i) => (
          <div
            key={src}
            className={styles.slide}
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            <Image
              src={src}
              alt={i === 0 ? title : `${title}, view ${i + 1}`}
              width={1200}
              height={1600}
              sizes="(max-width: 900px) 100vw, 55vw"
              priority={i === 0}
              className={styles.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
