// This file is intentionally left blank and can be deleted.
// The sitemap generation logic has been moved to a post-build script
// defined in `package.json` (`scripts/generate-sitemap.mjs`).
// This script generates a static `sitemap.xml` in the `/public` directory
// during the build process, resolving Vercel's multi-region deployment error.
// The presence of this dynamic route file was causing the issue.
