import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: absoluteUrl("/"), lastModified: now },
    { url: absoluteUrl("/how-it-works"), lastModified: now },
    { url: absoluteUrl("/ping"), lastModified: now },
  ];
}
