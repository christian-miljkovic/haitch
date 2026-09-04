import type { Metadata } from 'next';
import AppointmentForm from '@/components/AppointmentForm';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Book an Appointment' };

export default function AppointmentPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>BOOK AN APPOINTMENT</h1>
      <p className={styles.intro}>
        HAITCH offers both made-to-measure and bespoke tailoring by appointment only at our New
        York City showroom and trunk shows around the country.
      </p>
      <AppointmentForm />
    </div>
  );
}
