"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';

export default function VisitorLocationAnalytics() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !pathname || lastSent.current === pathname) return;
    const controller = new AbortController();
    async function report() {
      try {
        const response = await fetch('/api/visitor-location', {
          cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok) return;
        const location = await response.json();
        if (controller.signal.aborted) return;
        const properties: Record<string, string> = {};
        for (const key of ['state', 'city']) {
          if (typeof location[key] === 'string') properties[key] = location[key];
        }
        if (Object.keys(properties).length) {
          track('visitor_location', properties);
          lastSent.current = pathname;
        }
      } catch {
        // Analytics availability never affects navigation or commerce.
      }
    }
    void report();
    return () => controller.abort();
  }, [pathname]);

  return null;
}
