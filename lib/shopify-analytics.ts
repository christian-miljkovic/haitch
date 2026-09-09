import {
  AnalyticsEventName,
  getClientBrowserParameters,
  sendShopifyAnalytics,
  type ShopifyAnalyticsProduct,
  type ShopifyPageViewPayload,
} from '@shopify/hydrogen-react';
import type { Product, ProductVariant } from './product';

// Reports storefront activity to Shopify Analytics so sessions, product views
// and add-to-carts on this site show up alongside orders in the Shopify admin.
// All values here are public (baked into the browser bundle).

type Config = {
  shopId: string;
  storefrontToken: string;
  checkoutDomain: string;
  cookieDomain: string;
};

export function readAnalyticsConfig(): Config | null {
  const id = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID;
  const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  const checkoutDomain = process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN;
  const cookieDomain = process.env.NEXT_PUBLIC_SHOPIFY_COOKIE_DOMAIN;
  if (!id || !storefrontToken || !checkoutDomain || !cookieDomain) return null;
  return { shopId: `gid://shopify/Shop/${id}`, storefrontToken, checkoutDomain, cookieDomain };
}

// No consent banner: the store sells in the US only and sets first-party cookies.
// `hasUserConsent` gates sending; the three `*Allowed` flags are what Shopify's
// backend reads to decide whether the event counts in Analytics reports (they
// default to false in the SDK, so leaving them out reports nothing). Hydrogen
// derives them from the Customer Privacy API, which returns true wherever a
// consent banner is not required.
const HAS_USER_CONSENT = true;

function base(config: Config): ShopifyPageViewPayload {
  return {
    ...getClientBrowserParameters(),
    hasUserConsent: HAS_USER_CONSENT,
    analyticsAllowed: HAS_USER_CONSENT,
    marketingAllowed: HAS_USER_CONSENT,
    saleOfDataAllowed: HAS_USER_CONSENT,
    shopId: config.shopId,
    currency: 'USD',
    acceptedLanguage: 'EN',
    shopifySalesChannel: 'headless',
  };
}

export const productGid = (storeId: number) => `gid://shopify/Product/${storeId}`;
export const variantGid = (variantId: number) => `gid://shopify/ProductVariant/${variantId}`;

export function analyticsProduct(product: Product, variant?: ProductVariant, quantity = 1): ShopifyAnalyticsProduct | null {
  if (!product.storeId) return null;
  return {
    productGid: productGid(product.storeId),
    variantGid: variant ? variantGid(variant.id) : undefined,
    name: product.title,
    variantName: variant?.size,
    brand: 'HAITCH',
    price: String(variant?.price ?? product.price ?? 0),
    quantity,
  };
}

async function send(config: Config, eventName: keyof typeof AnalyticsEventName, payload: ShopifyPageViewPayload) {
  try {
    await sendShopifyAnalytics({ eventName: AnalyticsEventName[eventName], payload }, config.checkoutDomain);
  } catch (error) {
    console.warn('[shopify-analytics] event not sent:', error);
  }
}

export function trackPageView(pageType?: string) {
  const config = readAnalyticsConfig();
  if (!config) return;
  void send(config, 'PAGE_VIEW', { ...base(config), pageType });
}

export function trackProductView(product: Product) {
  const config = readAnalyticsConfig();
  const item = analyticsProduct(product);
  if (!config || !item) return;
  void send(config, 'PRODUCT_VIEW', {
    ...base(config),
    pageType: 'product',
    resourceId: item.productGid,
    products: [item],
  });
}

export function trackAddToCart(product: Product, variant: ProductVariant, quantity = 1) {
  const config = readAnalyticsConfig();
  const item = analyticsProduct(product, variant, quantity);
  if (!config || !item) return;
  void send(config, 'ADD_TO_CART', {
    ...base(config),
    totalValue: variant.price * quantity,
    products: [item],
  });
}
