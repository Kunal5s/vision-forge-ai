
import { type MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://imagenbrainai.in';

  // List of static pages in the app
  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/disclaimer',
    '/pricing',
    '/privacy',
    '/terms',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path === '/' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: path === '/' ? 1.0 : 0.8,
  }));

  return sitemapEntries;
}
