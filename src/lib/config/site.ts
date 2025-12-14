import { z } from "zod";

const SiteUrlSchema = z.string().url();

export const siteConfig = {
  name: "ping402",
  title: "ping402 — paid pings that get answered",
  description:
    "A pay-per-message inbox built on Solana settlement and x402 (HTTP 402 Payment Required).",
} as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const parsed = SiteUrlSchema.safeParse(explicit);
    if (!parsed.success) {
      throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
    }
    return parsed.data.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const baseUrl = getSiteUrl();
  if (!path) return baseUrl;
  if (!path.startsWith("/")) return `${baseUrl}/${path}`;
  return `${baseUrl}${path}`;
}
