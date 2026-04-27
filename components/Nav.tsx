import Link from "next/link";
import { Logo } from "./Logo";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#examples", label: "Examples" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]/60">
      <nav className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="#top" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-semibold tracking-tight text-base">Canvas Buddy</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="px-3 py-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="#cta"
            className="ml-2 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>
    </header>
  );
}
