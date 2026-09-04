import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Editorial hero, collections gallery and newsletter imagery still live
    // on the label's Shopify CDN; persisted bag lines may reference the
    // legacy cdn.shopify.com product photos.
    remotePatterns: [
      { protocol: "https", hostname: "haitch-usa.com", pathname: "/cdn/shop/**" },
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" },
    ],
  },
};

export default nextConfig;
