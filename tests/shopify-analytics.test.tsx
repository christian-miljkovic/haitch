import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makePurchasableProduct } from './helpers/products';

const sendShopifyAnalytics = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const useShopifyCookies = vi.fn<(...args: unknown[]) => boolean>(() => true);

// The SDK is the boundary: we assert the payloads the site hands it.
vi.mock('@shopify/hydrogen-react', () => ({
  AnalyticsEventName: { PAGE_VIEW: 'PAGE_VIEW', PRODUCT_VIEW: 'PRODUCT_VIEW', ADD_TO_CART: 'ADD_TO_CART' },
  ShopifySalesChannel: { headless: 'headless', hydrogen: 'hydrogen' },
  sendShopifyAnalytics: (...args: unknown[]) => sendShopifyAnalytics(...args),
  useShopifyCookies: (...args: unknown[]) => useShopifyCookies(...args),
  getClientBrowserParameters: () => ({
    uniqueToken: 'y',
    visitToken: 's',
    url: 'http://localhost/shop',
    path: '/shop',
    search: '',
    referrer: '',
    title: 'Shop',
    userAgent: 'test',
    navigationType: 'navigate',
    navigationApi: 'PerformanceNavigationTiming',
  }),
}));

const pathname = '/shop';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

beforeEach(() => {
  sendShopifyAnalytics.mockClear();
  useShopifyCookies.mockClear();
  vi.stubEnv('NEXT_PUBLIC_SHOPIFY_SHOP_ID', '93116367160');
  vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN', 'sf-token');
  vi.stubEnv('NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN', 'shop.example.com');
  vi.stubEnv('NEXT_PUBLIC_SHOPIFY_COOKIE_DOMAIN', 'example.com');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const eventsNamed = (name: string) =>
  sendShopifyAnalytics.mock.calls
    .map(([event]) => event as { eventName: string; payload: Record<string, unknown> })
    .filter((e) => e.eventName === name);

describe('Shopify analytics', () => {
  test('sets Shopify cookies shared with the checkout domain and reports a page view per route', async () => {
    const { default: ShopifyAnalytics } = await import('@/components/ShopifyAnalytics');
    render(<ShopifyAnalytics />);

    expect(useShopifyCookies).toHaveBeenCalledWith(
      expect.objectContaining({ hasUserConsent: true, domain: 'example.com', checkoutDomain: 'shop.example.com' })
    );
    const [view] = eventsNamed('PAGE_VIEW');
    expect(view.payload).toMatchObject({
      shopId: 'gid://shopify/Shop/93116367160',
      currency: 'USD',
      shopifySalesChannel: 'headless',
      hasUserConsent: true,
      path: '/shop',
    });
    // Events are sent under the store's own domain so cookies carry through to checkout.
    expect(sendShopifyAnalytics.mock.calls[0][1]).toBe('shop.example.com');
  });

  test('reports a product view with the Shopify product id when a product page opens', async () => {
    const { default: ProductView } = await import('@/components/ProductView');
    const product = makePurchasableProduct({ storeId: 5551 });
    render(<ProductView product={product} />);

    const [view] = eventsNamed('PRODUCT_VIEW');
    expect(view.payload).toMatchObject({
      pageType: 'product',
      resourceId: 'gid://shopify/Product/5551',
      products: [
        expect.objectContaining({
          productGid: 'gid://shopify/Product/5551',
          name: 'TEST JACKET',
          brand: 'HAITCH',
          price: '750',
        }),
      ],
    });
  });

  test('reports an add-to-cart with the chosen variant', async () => {
    const { CartProvider } = await import('@/components/CartContext');
    const { default: AddToCart } = await import('@/components/AddToCart');
    const user = userEvent.setup();
    const product = makePurchasableProduct({ storeId: 5551 });
    render(
      <CartProvider>
        <AddToCart product={product} />
      </CartProvider>
    );
    await user.selectOptions(screen.getByLabelText(/size/i), 'M');
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    const [event] = eventsNamed('ADD_TO_CART');
    expect(event.payload).toMatchObject({
      totalValue: 750,
      products: [
        expect.objectContaining({
          productGid: 'gid://shopify/Product/5551',
          variantGid: 'gid://shopify/ProductVariant/3',
          variantName: 'M',
          quantity: 1,
        }),
      ],
    });
  });

  test('sends nothing when the shop is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_SHOP_ID', '');
    const { default: ShopifyAnalytics } = await import('@/components/ShopifyAnalytics');
    render(<ShopifyAnalytics />);
    expect(sendShopifyAnalytics).not.toHaveBeenCalled();
  });
});
