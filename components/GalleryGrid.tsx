'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { GalleryStack as Stack, Placed } from '@/lib/gallery-layout';
import GalleryStack from './GalleryStack';
import GalleryViewer from './GalleryViewer';
import styles from './GalleryGrid.module.css';

type Open = { tile: number; frame: number };

// The balanced gallery plus the full-screen viewer it opens into.
export default function GalleryGrid({ columns }: { columns: Placed<Stack>[][] }) {
  const [open, setOpen] = useState<Open | null>(null);
  const tiles = columns.flat().sort((a, b) => a.index - b.index);
  const current = open ? tiles[open.tile] : null;

  return (
    <>
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
                <GalleryStack
                  images={item.images}
                  position={index}
                  onOpen={(frame) => setOpen({ tile: index, frame })}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {open && current && (
        <GalleryViewer
          images={current.item.images}
          position={open.tile}
          frame={open.frame}
          onFrameChange={(frame) => setOpen({ tile: open.tile, frame })}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
