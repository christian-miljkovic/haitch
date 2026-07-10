import type { Metadata } from 'next';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/lib/shopify';

export const metadata: Metadata = { title: 'Shop' };

export const revalidate = 600;

export default async function ShopPage() {
  const products = await getProducts();
  return <ProductGrid products={products} />;
}
