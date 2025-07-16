
// scripts/generate-sitemap.mjs
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { writeFile, readdir, readFile } from 'fs/promises';
import { join } from 'path';

// Your production domain
const hostname = 'https://www.imagenbrainai.in';

// List of static pages
const staticRoutes = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/about', changefreq: 'monthly', priority: 0.7 },
    { url: '/contact', changefreq: 'monthly', priority: 0.6 },
    { url: '/pricing', changefreq: 'monthly', priority: 0.8 },
    { url: '/edit', changefreq: 'yearly', priority: 0.1 },
    { url: '/terms', changefreq: 'yearly', priority: 0.3 },
    { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
    { url: '/disclaimer', changefreq: 'yearly', priority: 0.3 },
    { url: '/blog', changefreq: 'weekly', priority: 0.9 },
    { url: '/author/kunal-sonpitre', changefreq: 'weekly', priority: 0.8 },
];

async function generateSitemap() {
    console.log('🚀 Starting sitemap generation...');
    
    // Combine static routes
    const allLinks = staticRoutes.map(route => ({
        ...route,
        url: `${hostname}${route.url}`
    }));

    // Dynamically get categories and their articles
    const articlesDir = join(process.cwd(), 'src', 'articles');
    
    try {
        const categoryFiles = await readdir(articlesDir);

        for (const file of categoryFiles) {
            if (file.endsWith('.json')) {
                const categorySlug = file.replace('.json', '');
                
                // Add category page link
                allLinks.push({
                    url: `${hostname}/${categorySlug}`,
                    changefreq: 'weekly',
                    priority: 0.8,
                });
                console.log(`- Added category page: /${categorySlug}`);

                // Read articles from the file to add individual article links
                const filePath = join(articlesDir, file);
                const fileContent = await readFile(filePath, 'utf-8');
                const articles = JSON.parse(fileContent);

                if (Array.isArray(articles)) {
                    articles.forEach(article => {
                         if (article.slug && article.status !== 'draft') {
                             allLinks.push({
                                 url: `${hostname}/${categorySlug}/${article.slug}`,
                                 lastmod: article.publishedDate || new Date().toISOString(),
                                 changefreq: 'monthly',
                                 priority: 0.9,
                             });
                         }
                    });
                     console.log(`- Added ${articles.filter(a => a.status !== 'draft').length} articles from ${file}`);
                }
            }
        }

        const stream = new SitemapStream({ hostname });
        const sitemapXml = await streamToPromise(Readable.from(allLinks).pipe(stream)).then((data) =>
            data.toString()
        );

        const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml');
        await writeFile(sitemapPath, sitemapXml);
        
        console.log(`✅ Sitemap successfully generated at ${sitemapPath}`);

    } catch (e) {
        console.error('❌ Failed to generate sitemap:', e);
    }
}

generateSitemap();
