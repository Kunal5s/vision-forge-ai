// src/app/sitemap.xml/route.ts

// This file is now intentionally left blank.
// The sitemap generation logic has been moved to `next.config.ts`
// to generate a static sitemap.xml during the build process.
// This resolves the Vercel multi-region deployment error on the free plan.
// The presence of a route.ts file in this directory was causing Vercel
// to attempt deployment on the Edge runtime.

// By keeping this file but making it empty, we ensure no dynamic route is created.
// The actual sitemap will be generated and placed in the /public directory.

// Note: An alternative would be to delete this file and its folder, but
// leaving this explanatory note can prevent future confusion.
// For the purpose of this fix, the key is that this file does not export
// a GET handler or set a runtime.
