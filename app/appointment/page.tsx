import type { Metadata } from 'next';
import AppointmentForm from '@/components/AppointmentForm';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Book an Appointment' };

export default function AppointmentPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>BOOK AN APPOINTMENT</h1>
      <p className={styles.intro}>
        Visit our New York City atelier for fittings and made-to-order tailoring.
      </p>
      <AppointmentForm />
    </div>
  );
}
