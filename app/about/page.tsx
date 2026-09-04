import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>ABOUT</h1>
      <div className={styles.body}>
        <p>
          HAITCH is a luxury clothing brand focused on modern tailoring and refined wardrobe
          essentials. Founders Harry Tillman and Nate Pozin bring over 15 years of combined
          experience in bespoke tailoring and luxury fashion. Drawing on Savile Row principles of
          craftsmanship, quality, and longevity, HAITCH creates contemporary clothing that explores
          the balance of beauty, utility, luxury, and tradition.
        </p>
        <p>
          HAITCH offers bespoke, made-to-measure, and made-to-order clothing, producing expertly
          crafted garments globally using fabrics from leading mills around the world.
          Consultations are available by appointment at HAITCH’s New York City showroom and trunk
          shows around the country.
        </p>
      </div>
    </div>
  );
}
