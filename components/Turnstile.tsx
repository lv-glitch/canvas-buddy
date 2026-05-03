"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile widget — invisible bot-prevention check used to
 * gate the AI image generation endpoint (which costs ~$0.06 per call to
 * fal.ai and is the prime abuse target on this site).
 *
 * Usage:
 *   <Turnstile onToken={setToken} />
 *
 * onToken fires with the verification token (a string ~500 chars) once
 * the widget passes its check. The frontend then attaches that token to
 * the /api/generate-image request, and the backend verifies it via
 * Cloudflare's siteverify endpoint before doing the expensive call.
 *
 * Token expires after 5 minutes — Cloudflare auto-refreshes via the
 * `expired-callback`, so the latest token is always valid.
 */
interface TurnstileProps {
  onToken: (token: string) => void;
  /** Cloudflare site key. Override via NEXT_PUBLIC_TURNSTILE_SITE_KEY in env. */
  siteKey?: string;
  /** Visual hint where the widget mounts. Cloudflare manages its own size; the
   *  outer div is just a wrapper for layout. */
  className?: string;
  /** Bump this to force the widget to issue a new token. Turnstile tokens
   *  are single-use — after every form submit the parent should bump this
   *  so the next click has a fresh token waiting. */
  resetSignal?: number;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
          size?: "normal" | "compact" | "flexible" | "invisible";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Turnstile({ onToken, siteKey, className, resetSignal }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  // Keep the latest callback in a ref so we don't re-mount the widget every
  // time the parent re-renders.
  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);

  // Reset the widget when the parent bumps the signal — Turnstile tokens
  // are single-use, so after each form submit the parent invalidates its
  // local copy and bumps this to issue a fresh one.
  useEffect(() => {
    if (resetSignal === undefined || resetSignal === 0) return;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  useEffect(() => {
    const key = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!key) {
      console.warn("[turnstile] no NEXT_PUBLIC_TURNSTILE_SITE_KEY — bot check disabled");
      return;
    }

    function mount() {
      if (!containerRef.current || !window.turnstile) return;
      // Avoid double-mounting on Strict Mode / fast refresh.
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: key as string,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => {
          // Token's stale; reset and request a fresh one.
          if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
        },
        "error-callback": () => {
          // Cloudflare reports a fatal widget error (network, blocked
          // script, etc.). Reset and try again so the user isn't stuck
          // with an empty token forever.
          if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
        },
        theme: "dark",
        // `always` keeps the widget visible — passes invisibly for clean
        // browsers in <1s but stays clickable for anyone Cloudflare wants
        // to interact with. Earlier `interaction-only` hid the widget for
        // suspect traffic too, leaving the AI button stuck on "Verifying…"
        // when the user actually needed to click the box.
        appearance: "always",
        size: "flexible",
      });
    }

    if (window.turnstile) {
      mount();
    } else {
      // First mount: load the Cloudflare script. Subsequent mounts reuse
      // the already-loaded global.
      const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", mount, { once: true });
      } else {
        const s = document.createElement("script");
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        s.onload = mount;
        document.head.appendChild(s);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} className={className} />;
}
