"use strict";

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/travel-planner(.*)",
  "/my-plans(.*)",
  "/dashboard(.*)",
  "/credits(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/api/webhooks(.*)", // Webhook routes are public (Stripe needs to call them)
]);

export default clerkMiddleware((auth, req) => {
  // Skip authentication for public routes (like webhooks)
  if (isPublicRoute(req)) {
    return;
  }

  // Protect specific routes - require authentication
  if (isProtectedRoute(req)) {
    auth().protect();
  }
  // For all other routes, Clerk is initialized but not required
  // This allows currentUser() to work on all routes
});

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Match API routes
    "/(api|trpc)(.*)",
  ],
};
