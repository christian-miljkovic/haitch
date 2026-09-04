import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from '@/components/AddToCart';
import ProductGallery from '@/components/ProductGallery';
import SizeGuide from '@/components/SizeGuide';
import { formatPrice } from '@/lib/format';
import { getProduct, getProducts } from '@/lib/catalog';
import styles from './page.module.css';

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return getProducts().map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return { title: getProduct(handle)?.title ?? 'Product' };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();

  return (
    <div className={styles.layout}>
      <div className={styles.gallery}>
        <ProductGallery images={product.images} title={product.title} />
      </div>

      <div className={styles.panelWrap}>
        <div className={styles.panel}>
          <h1 className={styles.title}>{product.title}</h1>
          {product.price !== undefined && <p className={styles.price}>{formatPrice(product.price)}</p>}

          {product.variants.length > 0 && <AddToCart product={product} />}

          <p className={styles.sizes}>SIZES: {product.sizes}</p>

          <SizeGuide />

          <p className={styles.description}>{product.description}</p>

          {product.details.length > 0 && (
            <div className={styles.details}>
              <h2 className={styles.detailsHeading}>MORE DETAILS</h2>
              {product.details.map((group) => (
                <div key={group.heading} className={styles.detailGroup}>
                  <h3 className={styles.detailGroupHeading}>{group.heading}</h3>
                  <ul role="list">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
