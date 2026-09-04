export type ProductVariant = {
  id: number;
  size: string;
  price: number;
  available: boolean;
};

export type ProductDetailGroup = {
  heading: string;
  items: string[];
};

export type Product = {
  id: number;
  handle: string;
  title: string;
  description: string;
  // Undefined for unpriced products; the UI renders no price.
  price?: number;
  images: string[];
  // Display-only size run from the line sheet, e.g. "44, 46, 48 EU".
  sizes: string;
  details: ProductDetailGroup[];
  // Empty when nothing is purchasable; the UI renders no add-to-cart.
  variants: ProductVariant[];
};
