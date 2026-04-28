import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "./Logo";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#examples", label: "Examples" },
];

export async function Nav() {
  const { userId } = await auth();
  const signedIn = !!userId;
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
          {signedIn ? (
            <>
              <Link
                href="/app"
                className="ml-2 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Open app
              </Link>
              <div className="ml-2">
                <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden sm:inline-flex items-center px-3 py-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="ml-1 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
