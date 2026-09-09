'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useShopifyCookies } from '@shopify/hydrogen-react';
import { readAnalyticsConfig, trackPageView } from '@/lib/shopify-analytics';

// Mounted once in the root layout: keeps Shopify's visitor cookies on the
// shared top-level domain (so checkout attributes the session) and reports a
// page view on every route change. Product views are reported by the product page.
export default function ShopifyAnalytics() {
  const pathname = usePathname();
  const config = readAnalyticsConfig();

  useShopifyCookies({
    hasUserConsent: Boolean(config),
    domain: config?.cookieDomain ?? '',
    checkoutDomain: config?.checkoutDomain ?? '',
  });

  useEffect(() => {
    if (!config) return;
    // Product pages send their own PRODUCT_VIEW, which Shopify counts as the page view.
    if (pathname.startsWith('/products/')) return;
    trackPageView(pageTypeFor(pathname));
  }, [pathname, config]);

  return null;
}

function pageTypeFor(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname === '/shop') return 'collection';
  if (pathname === '/checkout') return 'cart';
  return 'page';
}
