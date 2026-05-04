"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

/**
 * Initialise PostHog once on first mount, capture pageviews on every
 * client-side route change, and identify the user by Clerk userId once
 * they sign in.
 *
 * Fail-open when NEXT_PUBLIC_POSTHOG_KEY is unset (local dev / unconfigured
 * deploys) — initialization is skipped, capture() calls become no-ops.
 *
 * Loaded inside the ClerkProvider tree from app/layout.tsx so useUser()
 * works.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    if (posthog.__loaded) return; // hot-reload safety
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // Pageviews are captured by <PageviewTracker /> below — we want App
      // Router navigations, which the autocapture mechanism misses.
      capture_pageview: false,
      capture_pageleave: true,
      // PostHog defaults to autocapturing every click + form submit. Useful
      // for engagement metrics; disable selectively if it gets noisy.
      autocapture: true,
      // Pre-launch we don't want PostHog session replay running until we
      // explicitly want it (it's the heaviest bundle + privacy concern).
      disable_session_recording: true,
    });
  }, []);

  return (
    <>
      {/* useSearchParams forces dynamic rendering on any subtree that uses
          it — wrap in Suspense so the rest of the page can still
          statically render. */}
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      <Identifier />
      {children}
    </>
  );
}

/**
 * Capture $pageview on every App Router navigation. Next.js doesn't fire a
 * full page load when navigating between routes, so PostHog's autocapture
 * misses these — we listen to pathname/searchParams changes ourselves.
 */
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    if (!pathname) return;
    let url = pathname;
    const qs = searchParams?.toString();
    if (qs) url = `${url}?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Tie events to a user identity once Clerk reports they're signed in.
 * Before sign-in PostHog uses an anonymous distinct_id (auto-generated
 * cookie) so you still see the funnel from landing → signup.
 */
function Identifier() {
  const { user, isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    if (!isLoaded) return;
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName || undefined,
      });
    } else {
      // Signed out — drop the identity so the next session is anonymous.
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
