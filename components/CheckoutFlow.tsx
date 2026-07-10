'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { buildCheckoutUrl, type CheckoutInfo } from '@/lib/checkout';
import { EMAIL_RE, formatPrice } from '@/lib/format';
import { useCart } from './CartContext';
import styles from './CheckoutFlow.module.css';

const STEPS = ['BAG', 'INFORMATION', 'SHIPPING', 'PAYMENT'] as const;

export default function CheckoutFlow() {
  const { lines, count, subtotal, remove, setQuantity } = useCart();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<CheckoutInfo>({ country: 'United States' });

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <p>YOUR BAG IS EMPTY</p>
        <Link href="/shop" className={styles.emptyLink}>
          SHOP
        </Link>
      </div>
    );
  }

  const set = (key: keyof CheckoutInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInfo((prev) => ({ ...prev, [key]: e.target.value }));

  const informationValid =
    EMAIL_RE.test(info.email ?? '') && !!info.firstName?.trim() && !!info.lastName?.trim();
  const shippingValid = !!info.address1?.trim() && !!info.city?.trim() && !!info.zip?.trim();

  const canContinue = [true, informationValid, shippingValid][step] ?? false;

  const continueLabel = step === 2 ? 'CONTINUE TO PAYMENT' : 'CONTINUE';

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <nav aria-label="Checkout steps" className={styles.stepper}>
          <ol>
            {STEPS.map((label, i) => (
              <li
                key={label}
                aria-current={i === step ? 'step' : undefined}
                className={i === step ? styles.current : i < step ? styles.done : styles.todo}
              >
                {label}
              </li>
            ))}
          </ol>
        </nav>

        {step === 0 && (
          <section className={styles.section} aria-label="Bag">
            <ul className={styles.lines}>
              {lines.map((line) => (
                <li key={line.variantId} className={styles.line}>
                  <div className={styles.thumb}>
                    {line.image && (
                      <Image src={line.image} alt={line.title} fill sizes="120px" className={styles.thumbImg} />
                    )}
                  </div>
                  <div className={styles.lineBody}>
                    <p className={styles.lineTitle}>{line.title}</p>
                    <p className={styles.lineMeta}>SIZE: {line.size}</p>
                    <p className={styles.lineMeta}>{formatPrice(line.price)}</p>
                    <div className={styles.quantityRow}>
                      <button
                        aria-label={`Decrease quantity, ${line.title}`}
                        onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        aria-label={`Increase quantity, ${line.title}`}
                        onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button className={styles.remove} onClick={() => remove(line.variantId)}>
                      ✕ REMOVE
                    </button>
                  </div>
                  <p className={styles.lineTotal}>{formatPrice(line.price * line.quantity)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 1 && (
          <section className={styles.section} aria-label="Information">
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="co-email">EMAIL</label>
                <input id="co-email" type="email" value={info.email ?? ''} onChange={set('email')} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="co-first">FIRST NAME</label>
                  <input id="co-first" value={info.firstName ?? ''} onChange={set('firstName')} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-last">LAST NAME</label>
                  <input id="co-last" value={info.lastName ?? ''} onChange={set('lastName')} />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="co-phone">PHONE (OPTIONAL)</label>
                <input id="co-phone" type="tel" value={info.phone ?? ''} onChange={set('phone')} />
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className={styles.section} aria-label="Shipping">
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="co-address">ADDRESS</label>
                <input id="co-address" value={info.address1 ?? ''} onChange={set('address1')} />
              </div>
              <div className={styles.field}>
                <label htmlFor="co-address2">APT, SUITE (OPTIONAL)</label>
                <input id="co-address2" value={info.address2 ?? ''} onChange={set('address2')} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="co-city">CITY</label>
                  <input id="co-city" value={info.city ?? ''} onChange={set('city')} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-state">STATE</label>
                  <input id="co-state" value={info.province ?? ''} onChange={set('province')} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-zip">ZIP</label>
                  <input id="co-zip" value={info.zip ?? ''} onChange={set('zip')} />
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className={styles.section} aria-label="Payment">
            <p className={styles.paymentNote}>
              You will be redirected to our secure checkout to complete payment. Shop Pay, Apple
              Pay, Google Pay and all major cards are accepted.
            </p>
            <a
              className={styles.payButton}
              href={buildCheckoutUrl(
                lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
                info
              )}
            >
              PROCEED TO PAYMENT
            </a>
          </section>
        )}

        {step < 3 && (
          <button
            className={styles.continue}
            disabled={!canContinue}
            onClick={() => canContinue && setStep((s) => s + 1)}
          >
            {continueLabel}
          </button>
        )}
        {step > 0 && (
          <button className={styles.back} onClick={() => setStep((s) => s - 1)}>
            BACK
          </button>
        )}
      </div>

      <aside aria-label="Order summary" className={styles.summary}>
        <h2 className={styles.summaryTitle}>ORDER SUMMARY ({count})</h2>
        <div className={styles.summaryRow}>
          <span>SUBTOTAL</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>SHIPPING</span>
          <span>CALCULATED AT CHECKOUT</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>TOTAL</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </aside>
    </div>
  );
}
