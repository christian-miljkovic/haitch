import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>ABOUT</h1>
      <div className={styles.body}>
        <p>
          HAITCH was founded in 2024 by Harry Tillman and Nate Pozin, born of a shared vision for
          how clothing should feel, function, and endure.
        </p>
        <p>
          Our mission is to make contemporary clothing that explores the balance of beauty,
          utility, luxury, and restraint.
        </p>
        <p>
          Harry spent more than a decade in luxury tailoring in the Savile Row tradition, most
          recently at Thom Sweeney; Nate arrived by way of music, consulting, and brand strategy.
          They met at Thom Sweeney New York.
        </p>
        <p>
          HAITCH is committed to creating a socially and ecologically responsible fashion house. We
          minimize waste and avoid overproduction: all HAITCH garments are made in New York City,
          and all tailoring items are made to order.
        </p>
      </div>
    </div>
  );
}
