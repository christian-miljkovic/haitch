'use client';

import { useEffect } from 'react';
import type { Product } from '@/lib/product';
import { trackProductView } from '@/lib/shopify-analytics';

// Reports a Shopify PRODUCT_VIEW for the product page it sits on.
export default function ProductView({ product }: { product: Product }) {
  useEffect(() => {
    trackProductView(product);
  }, [product]);
  return null;
}
