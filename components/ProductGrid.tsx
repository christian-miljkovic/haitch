import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product";
import { formatPrice } from "@/lib/format";
import styles from "./ProductGrid.module.css";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className={styles.grid}>
      {products.map((p, i) => {
        const soldOut =
          p.variants.length > 0 && p.variants.every((v) => !v.available);
        return (
          <Link
            key={p.id}
            href={`/products/${p.handle}`}
            className={`${styles.tile} ${soldOut ? styles.soldOut : ""}`}
          >
            <div className={styles.frame}>
              {p.images[0] && (
                <Image
                  src={p.images[0]}
                  alt={p.title}
                  fill
                  sizes="(max-width: 767px) 50vw, 25vw"
                  loading={i < 4 ? "eager" : undefined}
                  className={styles.primary}
                />
              )}
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
              {soldOut ? (
                <span className={styles.soldOutLabel}>SOLD OUT</span>
              ) : (
                p.price !== undefined && <span>{formatPrice(p.price)}</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
