import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const ownerHandle = (process.env.PING402_OWNER_HANDLE ?? "ping402")
    .trim()
    .toLowerCase();

  const now = new Date();

  return [
    { url: absoluteUrl("/"), lastModified: now },
    { url: absoluteUrl("/how-it-works"), lastModified: now },
    {
      url: absoluteUrl(`/u/${encodeURIComponent(ownerHandle)}`),
      lastModified: now,
    },
  ];
}

