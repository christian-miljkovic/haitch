'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { useCart } from './CartContext';
import styles from './BagDrawer.module.css';

export default function BagDrawer() {
  const { lines, count, subtotal, isOpen, remove, setQuantity, closeBag } = useCart();

  if (!isOpen) return null;

  return (
    <div className={styles.root}>
      <div className={styles.overlay} onClick={closeBag} aria-hidden="true" />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Bag">
        <header className={styles.header}>
          <h2 className={styles.title}>BAG ({count})</h2>
          <button className={styles.close} onClick={closeBag} aria-label="Close">
            ✕
          </button>
        </header>

        {lines.length === 0 ? (
          <p className={styles.empty}>YOUR BAG IS EMPTY</p>
        ) : (
          <>
            <ul className={styles.lines}>
              {lines.map((line) => (
                <li key={line.variantId} className={styles.line}>
                  <Link href={`/products/${line.handle}`} className={styles.thumb} onClick={closeBag}>
                    {line.image && (
                      <Image src={line.image} alt={line.title} fill sizes="96px" className={styles.thumbImg} />
                    )}
                  </Link>
                  <div className={styles.lineBody}>
                    <div className={styles.lineTop}>
                      <p className={styles.lineTitle}>{line.title}</p>
                      <p>{formatPrice(line.price)}</p>
                    </div>
                    <p className={styles.lineMeta}>{line.size}</p>
                    <div className={styles.quantityRow}>
                      <span>QUANTITY</span>
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span aria-label="Quantity">{line.quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button className={styles.remove} onClick={() => remove(line.variantId)}>
                      REMOVE
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className={styles.footer}>
              <div className={styles.totalRow}>
                <span>SHIPPING COST</span>
                <span>CALCULATED AT CHECKOUT</span>
              </div>
              <div className={`${styles.totalRow} ${styles.estimated}`}>
                <span>ESTIMATED TOTAL</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Link href="/checkout" className={styles.checkout} onClick={closeBag}>
                CHECKOUT
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
