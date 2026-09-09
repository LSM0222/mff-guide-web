import type { MetadataRoute } from "next";
import { createCanonicalUrl } from "./seo";

export default function robots(): MetadataRoute.Robots {
  const sitemap = createCanonicalUrl("/sitemap.xml");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/studio",
    },
    sitemap: sitemap ?? undefined,
  };
}
