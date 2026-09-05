'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { buildCheckoutUrl, type CheckoutInfo } from '@/lib/checkout';
import { formatPrice } from '@/lib/format';
import { email, none, optionalPhone, required, type Validator } from '@/lib/validation';
import FieldError from './FieldError';
import { useCart } from './CartContext';
import styles from './CheckoutFlow.module.css';

const STEPS = ['BAG', 'INFORMATION', 'SHIPPING', 'PAYMENT'] as const;

type FieldKey = Exclude<keyof CheckoutInfo, 'country'>;

const VALIDATORS: Record<FieldKey, Validator> = {
  email,
  firstName: required('Enter your first name.'),
  lastName: required('Enter your last name.'),
  phone: optionalPhone,
  address1: required('Enter your address.'),
  address2: none,
  city: required('Enter your city.'),
  province: required('Enter your state.'),
  zip: required('Enter your zip code.'),
};

const STEP_FIELDS: FieldKey[][] = [
  [],
  ['email', 'firstName', 'lastName', 'phone'],
  ['address1', 'address2', 'city', 'province', 'zip'],
];

export default function CheckoutFlow() {
  const { lines, count, subtotal, remove, setQuantity } = useCart();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<CheckoutInfo>({ country: 'United States' });
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

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

  const errorFor = (key: FieldKey) => VALIDATORS[key](info[key] ?? '');
  const shownError = (key: FieldKey) => (attempted || touched[key] ? errorFor(key) : null);
  const canContinue = (STEP_FIELDS[step] ?? []).every((key) => !errorFor(key));

  const field = (key: FieldKey, id: string) => ({
    id,
    value: info[key] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setInfo((prev) => ({ ...prev, [key]: e.target.value })),
    onBlur: () => setTouched((prev) => ({ ...prev, [key]: true })),
    'aria-invalid': shownError(key) ? true : undefined,
    'aria-describedby': shownError(key) ? `${id}-error` : undefined,
  });

  const goTo = (next: number) => {
    setStep(next);
    setAttempted(false);
  };

  const tryContinue = () => {
    setAttempted(true);
    if (canContinue) goTo(step + 1);
  };

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
                <input {...field('email', 'co-email')} type="email" />
                <FieldError id="co-email-error" message={shownError('email')} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="co-first">FIRST NAME</label>
                  <input {...field('firstName', 'co-first')} />
                <FieldError id="co-first-error" message={shownError('firstName')} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-last">LAST NAME</label>
                  <input {...field('lastName', 'co-last')} />
                <FieldError id="co-last-error" message={shownError('lastName')} />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="co-phone">PHONE (OPTIONAL)</label>
                <input {...field('phone', 'co-phone')} type="tel" />
                <FieldError id="co-phone-error" message={shownError('phone')} />
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className={styles.section} aria-label="Shipping">
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="co-address">ADDRESS</label>
                <input {...field('address1', 'co-address')} />
                <FieldError id="co-address-error" message={shownError('address1')} />
              </div>
              <div className={styles.field}>
                <label htmlFor="co-address2">APT, SUITE (OPTIONAL)</label>
                <input {...field('address2', 'co-address2')} />
                <FieldError id="co-address2-error" message={shownError('address2')} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="co-city">CITY</label>
                  <input {...field('city', 'co-city')} />
                <FieldError id="co-city-error" message={shownError('city')} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-state">STATE</label>
                  <input {...field('province', 'co-state')} />
                <FieldError id="co-state-error" message={shownError('province')} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-zip">ZIP</label>
                  <input {...field('zip', 'co-zip')} />
                <FieldError id="co-zip-error" message={shownError('zip')} />
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
          <button className={styles.continue} onClick={tryContinue}>
            {continueLabel}
          </button>
        )}
        {step > 0 && (
          <button className={styles.back} onClick={() => goTo(step - 1)}>
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
