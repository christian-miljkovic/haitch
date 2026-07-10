import Link from 'next/link';
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
          <Link href="/appointment">APPOINTMENTS</Link>
        </li>
        <li>
          <a href="https://www.instagram.com/haitch.usa" target="_blank" rel="noreferrer">
            INSTAGRAM
          </a>
        </li>
        <li>
          <a href="mailto:info@haitch-usa.com">CONTACT</a>
        </li>
      </ul>
      <p className={styles.copyright}>© 2026 HAITCH</p>
    </footer>
  );
}
