"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";

interface TopNavProps {
  videosUsed: number;
  videosLimit: number | null;            // null = unlimited (pro)
  plan: "free" | "payg" | "pro";
  onOpenSettings: () => void;
}

export function TopNav({ videosUsed, videosLimit, plan, onOpenSettings }: TopNavProps) {
  const planLabel =
    plan === "pro" ? "Pro" : plan === "payg" ? "Per Canvas" : "Free plan";
  let status: string;
  if (plan === "pro" || videosLimit === null) {
    status = `${planLabel} · unlimited`;
  } else {
    const remaining = Math.max(0, videosLimit - videosUsed);
    status = `${planLabel} — ${remaining} of ${videosLimit} videos remaining`;
  }

  return (
    <header className="h-14 bg-[#0a0a0a] border-b border-[var(--color-border)] flex items-center px-4 sm:px-6 flex-shrink-0">
      <Link href="/" className="flex items-center gap-2.5 mr-auto">
        <Logo size={28} />
        <span className="font-semibold tracking-tight text-[15px]">
          Canvas Buddy
        </span>
      </Link>

      <div className="hidden md:block text-xs text-[var(--color-ink-dim)] tabular-nums mr-4">
        {status}
      </div>

      {plan !== "pro" && (
        <Link
          href="/#pricing"
          className="hidden sm:inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-4 py-1.5 text-xs font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors mr-3"
        >
          Upgrade to Pro
        </Link>
      )}

      <button
        type="button"
        onClick={onOpenSettings}
        className="w-8 h-8 rounded-md border border-[var(--color-border)] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-dim)] transition-colors flex items-center justify-center mr-2"
        aria-label="Settings"
        title="Settings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    </header>
  );
}
