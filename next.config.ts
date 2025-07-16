
import type {NextConfig} from 'next';
import { categorySlugMap } from './src/lib/constants';
import { writeFile } from 'fs/promises';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow data URIs for generated images
    dangerouslyAllowSVG: true, // Not directly for data URIs but good to be aware of content types
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Example, adjust as needed
  },
  // This function is called after the build is complete
  async onBuild() {
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

    try {
        await writeFile('./public/sitemap.xml', sitemapXml);
        console.log('sitemap.xml successfully generated in /public folder.');
    } catch (e) {
        console.error('Failed to generate sitemap.xml', e);
    }
  },
};

export default nextConfig;
