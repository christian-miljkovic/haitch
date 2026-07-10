'use client';

import type { ImageLoaderProps } from 'next/image';

export default function shopifyImageLoader({ src, width }: ImageLoaderProps): string {
  return `${src}${src.includes('?') ? '&' : '?'}width=${width}`;
}
