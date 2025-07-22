import { authMiddleware } from "@clerk/nextjs";

// This middleware protects routes based on authentication status.
// The /admin route is protected, requiring authentication.
// Public routes are accessible to everyone.
// API webhooks are ignored by the middleware.
export default authMiddleware({
  publicRoutes: [
    "/",
    "/about",
    "/blog",
    "/contact",
    "/disclaimer",
    "/edit",
    "/inspiration",
    "/models",
    "/nft",
    "/pricing",
    "/privacy",
    "/prompts",
    "/storybook",
    "/styles",
    "/technology",
    "/terms",
    "/trends",
    "/tutorials",
    "/usecases",
    "/sign-in",
    "/sign-up",
    "/api/generate",
  ],
  ignoredRoutes: ["/api/webhook"],
});

export const config = {
  matcher: ["/((?!_next/image|favicon.ico).*)"],
};
