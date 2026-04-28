import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAppRoute = createRouteMatcher(["/app(.*)"]);
const isProtectedApi = createRouteMatcher(["/api/canvases(.*)", "/api/me(.*)"]);
// Public diagnostic endpoint that reveals only paid/status booleans —
// safe to expose unauthenticated for now. Subset must match BEFORE the
// broader /api/canvases gate so it's reachable.
const isPublicProbe = createRouteMatcher(["/api/canvases/:id/probe"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // API routes — JSON 401 for unauthenticated callers, except the probe.
  if (isProtectedApi(req) && !isPublicProbe(req) && !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // App pages — redirect to sign-in on unauthenticated, preserving return URL.
  if (isAppRoute(req) && !userId) {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signIn);
  }
});

export const config = {
  // Skip Next.js internals + static files; run on every page + API route.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|examples/.*|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|webm)).*)",
    "/(api|trpc)(.*)",
  ],
};
