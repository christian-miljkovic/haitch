import type { Metadata } from 'next';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Shop' };

export default function ShopPage() {
  return <ProductGrid products={getProducts()} />;
}
