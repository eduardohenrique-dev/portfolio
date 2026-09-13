import type { MetadataRoute } from "next";

const URL_SITE =
  process.env.NEXT_PUBLIC_URL_SITE ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: URL_SITE, lastModified: new Date("2026-09-13"), changeFrequency: "monthly", priority: 1 }];
}
