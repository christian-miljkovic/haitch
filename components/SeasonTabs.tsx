import Link from 'next/link';
import { SEASONS } from '@/lib/gallery';
import styles from './SeasonTabs.module.css';

// Top-left switch between collection seasons; the active one carries the
// same hairline underline as the nav.
export default function SeasonTabs({ active }: { active: string }) {
  return (
    <nav className={styles.tabs} aria-label="Seasons">
      {SEASONS.map((season) => (
        <Link
          key={season.slug}
          href={season.href}
          className={`${styles.tab} ${season.slug === active ? styles.active : ''}`}
          aria-current={season.slug === active ? 'page' : undefined}
        >
          {season.label}
        </Link>
      ))}
    </nav>
  );
}
