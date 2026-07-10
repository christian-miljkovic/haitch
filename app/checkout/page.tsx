import type { Metadata } from 'next';
import CheckoutFlow from '@/components/CheckoutFlow';

export const metadata: Metadata = { title: 'Checkout' };

export default function CheckoutPage() {
  return <CheckoutFlow />;
}
