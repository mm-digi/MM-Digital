import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mm-digi.co.uk" },
    ],
  },
};

export default nextConfig;
