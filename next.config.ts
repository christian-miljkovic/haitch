import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Bag lines persisted before the catalog switch may still reference
    // legacy cdn.shopify.com product photos.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" }],
    // 90 is reserved for the landing hero; everything else uses the default 75.
    qualities: [75, 90],
  },
};

export default nextConfig;
