'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import styles from './Nav.module.css';

const LINKS = [
  { href: '/shop', label: 'SHOP' },
  { href: '/collections', label: 'COLLECTIONS' },
  { href: '/about', label: 'ABOUT' },
  { href: '/appointment', label: 'BOOK AN APPOINTMENT' },
];

export default function Nav() {
  const pathname = usePathname();
  const { count, openBag } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav} aria-label="Main">
        <button
          className={styles.menuButton}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? 'CLOSE' : 'MENU'}
        </button>

        <ul className={styles.links}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`${styles.link} ${pathname === l.href ? styles.active : ''}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/" className={styles.wordmark}>
          HAITCH
        </Link>

        <div className={styles.right}>
          <button className={styles.link} onClick={openBag}>
            BAG ({count})
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
