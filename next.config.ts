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
      // Old WordPress sitemap addresses, which crawlers and SEO tools still look for.
      { source: "/sitemap_index.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/page-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/post-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      {
        source: "/6135-2/",
        destination: "/why-most-businesses-waste-their-ad-spend-and-what-to-do-instead/",
        permanent: true,
      },
      {
        source: "/packages",
        destination: "/pricing/",
        permanent: true,
      },
      {
        source: "/packages/",
        destination: "/pricing/",
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
