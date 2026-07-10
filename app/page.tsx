import { getImageProps } from 'next/image';
import Link from 'next/link';
import { HERO_IMAGE, HERO_IMAGE_MOBILE } from '@/lib/gallery';
import { shopifyImageLoader } from '@/lib/shopify-image';
import styles from './page.module.css';

export default function Home() {
  const common = {
    alt: 'HAITCH tailoring, made in New York City',
    priority: true,
    sizes: '100vw',
    loader: shopifyImageLoader,
  };
  const {
    props: { srcSet: desktopSrcSet, ...imgProps },
  } = getImageProps({ ...common, src: HERO_IMAGE, width: 3000, height: 1688 });
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, src: HERO_IMAGE_MOBILE, width: 1500, height: 1942 });

  return (
    <section className={styles.hero}>
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
        <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes via imgProps */}
        <img {...imgProps} className={styles.heroImage} />
      </picture>
      <Link href="/shop" className={styles.cta}>
        SHOP THE COLLECTION
      </Link>
    </section>
  );
}
