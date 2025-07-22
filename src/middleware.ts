
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
]);

const isPublicRoute = createRouteMatcher([
    '/',
    '/about',
    '/blog(.*)',
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
    '/stories(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/generate',
    '/sitemap.xml'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
}, {
    ignoredRoutes: ["/api/webhook"],
});


export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
