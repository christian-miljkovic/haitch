import type { ImageLoaderProps } from 'next/image';

// Shopify's CDN resizes natively via the width query param.
export function shopifyImageLoader({ src, width }: ImageLoaderProps): string {
  return `${src}${src.includes('?') ? '&' : '?'}width=${width}`;
}
