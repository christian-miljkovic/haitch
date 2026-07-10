import Image from 'next/image';
import Link from 'next/link';
import { HERO_IMAGE } from '@/lib/gallery';
import styles from './page.module.css';

export default function Home() {
  return (
    <section className={styles.hero}>
      <Image
        src={HERO_IMAGE}
        alt="HAITCH tailoring, made in New York City"
        fill
        priority
        sizes="100vw"
        className={styles.heroImage}
      />
      <Link href="/shop" className={styles.cta}>
        SHOP THE COLLECTION
      </Link>
    </section>
  );
}
