
// This file generates the sitemap.xml for the website.
// It includes static routes and dynamic category routes.
// For production, ensure the `URL` constant is updated to your website's domain.
import { categorySlugMap } from '@/lib/constants';

const URL = 'https://your-production-domain.com';

export async function GET() {
    const staticRoutes = [
        '',
        '/about',
        '/contact',
        '/pricing',
        '/edit',
        '/terms',
        '/privacy',
        '/disclaimer',
        '/blog',
    ].map((route) => ({
        url: `${URL}${route}`,
        lastModified: new Date().toISOString(),
    }));

    // Dynamically get categories from the constant map
    const categoryRoutes = Object.keys(categorySlugMap).map((slug) => ({
        url: `${URL}/${slug}`,
        lastModified: new Date().toISOString(),
    }));

    const routes = [...staticRoutes, ...categoryRoutes];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map(
      ({ url, lastModified }) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`
    )
    .join('')}
</urlset>`;
    
    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
