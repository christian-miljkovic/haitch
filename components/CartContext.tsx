'use client';

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import type { Product, ProductVariant } from '@/lib/shopify';

export type BagLine = {
  variantId: number;
  handle: string;
  title: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  lines: BagLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  add: (product: Product, variant: ProductVariant) => void;
  remove: (variantId: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  openBag: () => void;
  closeBag: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'haitch-bag';
const EMPTY: BagLine[] = [];

// localStorage is the source of truth, exposed as an external store so that
// server render and first client render agree (empty bag) and the real
// contents appear right after hydration.
const listeners = new Set<() => void>();
let cache: { raw: string | null; lines: BagLine[] } = { raw: null, lines: EMPTY };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): BagLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cache.raw) {
    try {
      cache = { raw, lines: raw ? (JSON.parse(raw) as BagLine[]) : EMPTY };
    } catch {
      cache = { raw, lines: EMPTY };
    }
  }
  return cache.lines;
}

function getServerSnapshot(): BagLine[] {
  return EMPTY;
}

function writeLines(lines: BagLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Ignore storage failures (private mode, quota); bag lives in memory only.
    cache = { raw: cache.raw, lines };
  }
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      isOpen,
      add: (product, variant) => {
        const existing = lines.find((l) => l.variantId === variant.id);
        writeLines(
          existing
            ? lines.map((l) =>
                l.variantId === variant.id ? { ...l, quantity: l.quantity + 1 } : l
              )
            : [
                ...lines,
                {
                  variantId: variant.id,
                  handle: product.handle,
                  title: product.title,
                  size: variant.size,
                  price: variant.price,
                  image: product.images[0] ?? '',
                  quantity: 1,
                },
              ]
        );
        setIsOpen(true);
      },
      remove: (variantId) => writeLines(lines.filter((l) => l.variantId !== variantId)),
      setQuantity: (variantId, quantity) =>
        writeLines(
          quantity < 1
            ? lines.filter((l) => l.variantId !== variantId)
            : lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l))
        ),
      openBag: () => setIsOpen(true),
      closeBag: () => setIsOpen(false),
    };
  }, [lines, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
