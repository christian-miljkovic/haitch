import Link from 'next/link';
import NewsletterModal from './NewsletterModal';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <ul className={styles.links}>
        <li>
          <Link href="/shop">SHOP</Link>
        </li>
        <li>
          <Link href="/about">ABOUT</Link>
        </li>
        <li>
          <Link href="/appointment">BOOK AN APPOINTMENT</Link>
        </li>
        <li>
          <NewsletterModal />
        </li>
        <li>
          <a href="https://www.instagram.com/haitch.usa" target="_blank" rel="noreferrer">
            INSTAGRAM
          </a>
        </li>
        <li>
          <Link href="/contact">CONTACT</Link>
        </li>
      </ul>
      <p className={styles.copyright}>© 2026 HAITCH</p>
    </footer>
  );
}
