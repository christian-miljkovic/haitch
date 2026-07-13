import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>CONTACT</h1>

      <div className={styles.sections}>
        <section className={styles.section}>
          <h2 className={styles.label}>GENERAL &amp; ORDERS</h2>
          <a className={styles.value} href="mailto:info@haitch-usa.com">
            info@haitch-usa.com
          </a>
          <p className={styles.note}>
            Questions about sizing, orders, shipping and returns. We respond within one business
            day.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.label}>PRESS</h2>
          <a className={styles.value} href="mailto:press@haitch-usa.com">
            press@haitch-usa.com
          </a>
          <p className={styles.note}>Press, partnerships and image requests.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.label}>ATELIER</h2>
          <Link className={styles.value} href="/appointment">
            BOOK AN APPOINTMENT ›
          </Link>
          <p className={styles.note}>
            Fittings and made-to-order tailoring at our New York City atelier, by appointment.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.label}>INSTAGRAM</h2>
          <a
            className={styles.value}
            href="https://www.instagram.com/haitch.usa"
            target="_blank"
            rel="noreferrer"
          >
            @haitch.usa
          </a>
        </section>
      </div>
    </div>
  );
}
