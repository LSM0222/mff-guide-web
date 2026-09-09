import type { MetadataRoute } from "next";
import { getGuides } from "@/sanity/lib/content";
import { createCanonicalUrl } from "./seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["/", "/guides", "/glossary"];
  const guides = await getGuides();
  const paths = [...staticPaths, ...guides.map((guide) => `/guides/${guide.slug}`)];

  return paths
    .map((pathname) => {
      const url = createCanonicalUrl(pathname);
      return url ? { url } : null;
    })
    .filter((entry): entry is MetadataRoute.Sitemap[number] => entry !== null);
}
