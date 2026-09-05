import { getImageProps } from 'next/image';
import Link from 'next/link';
import { HERO_IMAGE, HERO_IMAGE_MOBILE } from '@/lib/gallery';
import styles from './page.module.css';

export default function Home() {
  const common = {
    alt: 'HAITCH tailoring, made in New York City',
    priority: true,
    sizes: '100vw',
    quality: 90,
  };
  const {
    props: { srcSet: desktopSrcSet, ...imgProps },
  } = getImageProps({ ...common, ...HERO_IMAGE });
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, ...HERO_IMAGE_MOBILE });

  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
          <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes via imgProps */}
          <img {...imgProps} className={styles.heroImage} />
        </picture>
        <Link href="/shop" className={styles.cta}>
          SHOP THE COLLECTION
        </Link>
      </div>
    </section>
  );
}
