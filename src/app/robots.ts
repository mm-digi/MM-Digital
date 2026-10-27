import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login/", "/team-access/", "/pixel/", "/*-dashboard/", "/evolution-padel-2/"],
    },
    sitemap: "https://mm-digi.co.uk/sitemap.xml",
  };
}
