import Link from "next/link";
import { Logo } from "./Logo";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden hero-glow"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8 pt-20 sm:pt-28 pb-20 sm:pb-28 text-center">
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="relative">
            <Logo size={88} className="drop-shadow-[0_0_40px_rgba(30,215,96,0.35)]" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Upload your art. Or describe it.
          <br className="hidden sm:block" />
          <span className="text-[var(--color-accent)]"> Get a Canvas video</span>{" "}
          in seconds.
        </h1>

        <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-[var(--color-ink-dim)] leading-relaxed">
          Bring your own image or let AI generate one from a prompt. Apply an effect
          and a filter. Export a looping Spotify-ready Canvas — no editing tools, no
          rendering software.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center" id="cta">
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-7 py-3.5 text-base font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Start for free
          </Link>
          <Link
            href="#examples"
            className="inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-transparent px-7 py-3.5 text-base font-semibold text-[var(--color-ink)] hover:border-[var(--color-ink-dim)] transition-colors"
          >
            See examples
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--color-ink-muted)] tracking-wide uppercase">
          No credit card · 5 free canvases / month
        </p>
      </div>
    </section>
  );
}
