
import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/',
    '/about',
    '/contact',
    '/disclaimer',
    '/edit',
    '/inspiration',
    '/models',
    '/nft',
    '/pricing',
    '/privacy',
    '/prompts',
    '/storybook',
    '/styles',
    '/technology',
    '/terms',
    '/trends',
    '/tutorials',
    '/usecases',
    '/blog',
    '/stories',
    '/stories/(.*)',
    '/author/(.*)',
    '/api/generate',
    '/api/generate-article',
    '/(.*)/(.*)',
    ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: ['/no-auth-in-this-route'],
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
