'use client';

import { useId, useState } from 'react';
import type { Product } from '@/lib/shopify';
import { useCart } from './CartContext';
import styles from './AddToCart.module.css';

export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const selectId = useId();
  const firstAvailable = product.variants.find((v) => v.available);
  const [size, setSize] = useState(firstAvailable?.size ?? '');
  const variant = product.variants.find((v) => v.size === size);
  const soldOut = !firstAvailable;

  return (
    <div className={styles.root}>
      <div className={styles.sizeRow}>
        <label htmlFor={selectId} className={styles.sizeLabel}>
          SIZE
        </label>
        <select
          id={selectId}
          className={styles.select}
          value={size}
          onChange={(e) => setSize(e.target.value)}
          disabled={soldOut}
        >
          {product.variants.map((v) => (
            <option key={v.id} value={v.size} disabled={!v.available}>
              {v.available ? v.size : `${v.size} — SOLD OUT`}
            </option>
          ))}
        </select>
      </div>

      <button
        className={styles.button}
        disabled={!variant?.available}
        onClick={() => variant && add(product, variant)}
      >
        {soldOut ? 'SOLD OUT' : 'ADD TO CART'}
      </button>
    </div>
  );
}
