import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that REQUIRE auth — anything else is public.
const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/api/canvases(.*)",
  "/api/me(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Skip Next.js internals + static files; run on every page + API route.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|examples/.*|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|webm)).*)",
    "/(api|trpc)(.*)",
  ],
};
