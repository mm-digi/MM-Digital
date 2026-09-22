import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mm-digi.co.uk" },
    ],
  },

  async redirects() {
    return [
      {
        source: "/6135-2/",
        destination: "/why-most-businesses-waste-their-ad-spend-and-what-to-do-instead/",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/email-signature/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
