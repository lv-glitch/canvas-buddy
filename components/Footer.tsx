import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-auto">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2.5 text-[var(--color-ink-dim)]">
          <Logo size={22} />
          <span className="font-semibold text-[var(--color-ink)]">Canvas Buddy</span>
        </div>
        <p className="text-[var(--color-ink-muted)] text-xs sm:text-sm">
          Made for artists. Not affiliated with Spotify.
        </p>
      </div>
    </footer>
  );
}
