// This file is deprecated and intentionally left mostly blank.
// A static sitemap.xml is now used in the /public folder for Cloudflare Pages compatibility.
// This prevents Next.js from trying to dynamically generate a sitemap during the build.
import { type MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
