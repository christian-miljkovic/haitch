'use client';

import type { ImageLoaderProps } from 'next/image';
import { shopifyImageLoader } from './shopify-image';

export default function loader(props: ImageLoaderProps): string {
  return shopifyImageLoader(props);
}
