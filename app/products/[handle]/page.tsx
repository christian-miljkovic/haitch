import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from '@/components/AddToCart';
import ProductGallery from '@/components/ProductGallery';
import SizeGuide from '@/components/SizeGuide';
import { formatPrice } from '@/lib/format';
import { getProduct, getProducts } from '@/lib/shopify';
import styles from './page.module.css';

export const revalidate = 600;

type Props = { params: Promise<{ handle: string }> };

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  return { title: product?.title ?? 'Product' };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  const madeToOrder = /made to order/i.test(product.description);

  return (
    <div className={styles.layout}>
      <div className={styles.gallery}>
        <ProductGallery images={product.images} title={product.title} />
      </div>

      <div className={styles.panelWrap}>
        <div className={styles.panel}>
          <h1 className={styles.title}>{product.title}</h1>
          <p className={styles.price}>{formatPrice(product.price)}</p>

          <AddToCart product={product} />

          <SizeGuide />

          <p className={styles.description}>{product.description}</p>

          {madeToOrder && (
            <p className={styles.note}>MADE TO ORDER IN NEW YORK CITY — 4–6 WEEK PRODUCTION</p>
          )}

          <ul className={styles.links}>
            <li>
              <Link href="/appointment">BOOK AN APPOINTMENT ›</Link>
            </li>
            <li>
              <a href="mailto:info@haitch-usa.com">SHIPPING AND RETURNS ›</a>
            </li>
            <li>
              <a href="mailto:info@haitch-usa.com">CUSTOMER SERVICE ›</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
