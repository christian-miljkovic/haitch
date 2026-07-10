import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/shopify';
import { formatPrice } from '@/lib/format';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className={styles.grid}>
      {products.map((p, i) => (
        <Link key={p.id} href={`/products/${p.handle}`} className={styles.tile}>
          <div className={styles.frame}>
            <Image
              src={p.images[0]}
              alt={p.title}
              fill
              sizes="(max-width: 767px) 50vw, 25vw"
              priority={i < 4}
              className={styles.primary}
            />
            {p.images[1] && (
              <Image
                src={p.images[1]}
                alt=""
                fill
                sizes="(max-width: 767px) 50vw, 25vw"
                className={styles.secondary}
              />
            )}
          </div>
          <div className={styles.meta}>
            <span className={styles.name}>{p.title}</span>
            <span>{formatPrice(p.price)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
