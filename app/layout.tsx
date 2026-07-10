import type { Metadata, Viewport } from 'next';
import { CartProvider } from '@/components/CartContext';
import Nav from '@/components/Nav';
import BagDrawer from '@/components/BagDrawer';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'HAITCH',
    template: '%s — HAITCH',
  },
  description:
    'HAITCH — contemporary clothing exploring the balance of beauty, utility, luxury, and restraint. Made in New York City.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
          <BagDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
