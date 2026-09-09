"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/lib/gallery";
import styles from "./GalleryViewer.module.css";

type Props = {
  images: Photo[];
  // Spoken name of what is being viewed, e.g. "Lookbook image 4" or a product title.
  label: string;
  frame: number;
  onFrameChange: (frame: number) => void;
  onClose: () => void;
  // Hovering magnifies the photo under the cursor. On for product photos,
  // where detail matters; off for the editorial lookbook.
  magnify?: boolean;
};

const ZOOM = 2;

// Only magnify for a real pointer; touch devices pinch instead.
const canHover = () =>
  typeof matchMedia === "undefined" ||
  matchMedia("(hover: hover) and (pointer: fine)").matches;

// Full-screen view of a set of frames. Arrow keys and the side controls step
// through them, hovering optionally magnifies the photo under the cursor, and
// Escape or the close control returns to the page.
export default function GalleryViewer({
  images,
  label,
  frame,
  onFrameChange,
  onClose,
  magnify = false,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const count = images.length;
  const step = (delta: number) =>
    onFrameChange((frame + delta + count) % count);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (count > 1 && e.key === "ArrowRight") step(1);
      if (count > 1 && e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const image = images[frame];

  const trackCursor = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!magnify || !canHover()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: rect.width ? ((e.clientX - rect.left) / rect.width) * 100 : 50,
      y: rect.height ? ((e.clientY - rect.top) / rect.height) * 100 : 50,
    });
  };

  return createPortal(
    <div
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-label={`${label}${count > 1 ? `, frame ${frame + 1} of ${count}` : ""}`}
    >
      <button
        ref={closeRef}
        className={styles.close}
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      <div
        className={styles.stage}
        onClick={() => (count > 1 ? step(1) : onClose())}
      >
        <Image
          key={image.src}
          src={image.src}
          alt={`${label}${count > 1 ? `, frame ${frame + 1}` : ""}`}
          width={image.width}
          height={image.height}
          sizes="100vw"
          className={`${styles.image} ${magnify ? styles.zoomable : ""} ${origin ? styles.magnified : ""}`}
          style={
            origin
              ? {
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                  transform: `scale(${ZOOM})`,
                }
              : undefined
          }
          onMouseMove={trackCursor}
          onMouseLeave={() => setOrigin(null)}
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
          <button
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => step(1)}
            aria-label="Next frame"
          >
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
    document.body,
  );
}
