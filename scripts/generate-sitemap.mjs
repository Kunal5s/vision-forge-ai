
import { categorySlugMap } from '../src/lib/constants.js';
import { writeFile } from 'fs/promises';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { join } from 'path';

async function generateSitemap() {
  console.log('Generating static sitemap...');
  const hostname = 'https://www.imagenbrainai.in'; // Your production domain

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
      '/author/kunal-sonpitre',
  ].map((route) => ({
      url: `${hostname}${route}`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8
  }));

  // Dynamically get categories from the constant map
  const categoryRoutes = Object.keys(categorySlugMap).map((slug) => ({
      url: `${hostname}/${slug}`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8
  }));

  const allLinks = [...staticRoutes, ...categoryRoutes];

  const stream = new SitemapStream({ hostname });
  const sitemapXml = await streamToPromise(Readable.from(allLinks).pipe(stream)).then((data) =>
      data.toString()
  );

  const publicPath = join(process.cwd(), 'public');
  
  try {
      await writeFile(join(publicPath, 'sitemap.xml'), sitemapXml);
      console.log('sitemap.xml successfully generated in /public folder.');
  } catch (e) {
      console.error('Failed to generate sitemap.xml', e);
      process.exit(1); // Exit with error code if generation fails
  }
}

generateSitemap();
