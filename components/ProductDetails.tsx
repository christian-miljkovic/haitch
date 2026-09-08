'use client';

import { useId, useState } from 'react';
import type { ProductDetailGroup } from '@/lib/product';
import styles from './ProductDetails.module.css';

// "MORE DETAILS" disclosure on the product page: closed by default, opens the
// styling details and materials & care lists from the line sheet.
export default function ProductDetails({ groups }: { groups: ProductDetailGroup[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span>MORE DETAILS</span>
        <span className={`${styles.icon} ${open ? styles.iconOpen : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} className={styles.panel}>
          {groups.map((group) => (
            <div key={group.heading} className={styles.group}>
              <h3 className={styles.groupHeading}>{group.heading}</h3>
              <ul role="list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
