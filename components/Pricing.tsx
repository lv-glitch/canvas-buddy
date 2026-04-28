"use client";

import { useState } from "react";

interface Plan {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  /** "subscribe" → POST /api/checkout?tier=pro and redirect to the URL.
   *  "buy"        → per-canvas one-off (Phase B, not yet wired).
   *  "signup"     → just go to /sign-up. */
  action: "signup" | "subscribe" | "buy";
  highlight?: "purple" | "green";
  badge?: string;
  tagline?: string;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    features: [
      "5 videos per month",
      "All effects and filters",
      "Upload your own image",
      "5 AI generations per month",
      "Canvas Buddy watermark",
    ],
    cta: "Start for free",
    action: "signup",
  },
  {
    name: "Per Canvas",
    price: "$4.99",
    cadence: "per video",
    tagline: "Pay only when you need it",
    features: [
      "Everything in Free",
      "No watermark",
      "5 AI generations per month",
      "No subscription",
    ],
    cta: "Buy a canvas",
    action: "buy",
    highlight: "purple",
  },
  {
    name: "Pro",
    price: "$9.99",
    cadence: "per month",
    features: [
      "Unlimited videos",
      "Everything in Free",
      "Unlimited AI generations",
      "No watermark",
      "Batch upload",
      "Priority rendering",
    ],
    cta: "Go Pro",
    action: "subscribe",
    highlight: "green",
    badge: "Best value",
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="px-5 sm:px-8 py-16 sm:py-24 bg-[var(--color-surface)]/30"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Simple pricing.
          </h2>
          <p className="mt-3 text-[var(--color-ink-dim)]">
            Start free. Pay-as-you-go when you need a clean export. Go Pro when
            you ship more.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-[var(--color-ink-dim)]">
          Need 3+ watermark-free videos a month? Pro saves you money.
        </p>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const isGreen = plan.highlight === "green";
  const isPurple = plan.highlight === "purple";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    if (plan.action === "signup") {
      window.location.href = "/sign-up";
      return;
    }
    if (plan.action === "buy") {
      // Per-canvas $4.99 buys a single watermark-removal — gated on a canvas
      // existing first. Redirect to /app where the per-canvas CTA on each
      // library row can wire to Stripe Checkout (Phase B).
      window.location.href = "/sign-up?next=buy";
      return;
    }
    // Pro subscription via Stripe Checkout.
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro" }),
      });
      if (r.status === 401) {
        // Not signed in yet — bounce through sign-up, come back here.
        window.location.href = "/sign-up?next=pro";
        return;
      }
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const wrapperClasses = [
    "relative rounded-[var(--radius-card)] bg-[var(--color-surface)] p-7 sm:p-9 flex flex-col",
    isGreen ? "border-2 border-[var(--color-accent)]" : "",
    isPurple ? "border" : "",
    !isGreen && !isPurple ? "border border-[var(--color-border)]" : "",
  ].join(" ");

  // Inline style applies the soft purple border the spec asked for —
  // rgba(179,136,255,0.3) — without polluting the Tailwind class set.
  const wrapperStyle =
    isPurple ? { borderColor: "rgba(179,136,255,0.3)" } : undefined;

  const ctaClasses = isGreen
    ? "bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]"
    : isPurple
    ? "bg-[var(--color-purple)] text-black hover:bg-[var(--color-purple-hover)]"
    : "border border-[var(--color-border)] hover:border-[var(--color-ink-dim)]";

  const checkColor = isGreen
    ? "var(--color-accent)"
    : isPurple
    ? "var(--color-purple)"
    : "var(--color-ink-dim)";

  return (
    <div className={wrapperClasses} style={wrapperStyle}>
      {plan.badge && (
        <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-accent)] text-black text-[10px] font-semibold tracking-wide uppercase">
          {plan.badge}
        </span>
      )}

      <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-ink-dim)]">
        {plan.name}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl sm:text-5xl font-bold tracking-tight">
          {plan.price}
        </span>
        <span className="text-[var(--color-ink-dim)] text-sm">
          / {plan.cadence}
        </span>
      </div>

      {plan.tagline && (
        <p className="mt-2 text-xs text-[var(--color-purple)] font-medium">
          {plan.tagline}
        </p>
      )}

      <ul className="mt-7 space-y-3 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-[15px]">
            <Check color={checkColor} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={[
          "mt-8 inline-flex items-center justify-center rounded-[var(--radius-pill)] px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
          ctaClasses,
        ].join(" ")}
      >
        {busy ? "Loading…" : plan.cta}
      </button>
      {err && (
        <p className="mt-2 text-[11px] text-[#ff6b6b] leading-snug">{err}</p>
      )}
    </div>
  );
}

function Check({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color }}
      className="mt-0.5 flex-shrink-0"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
