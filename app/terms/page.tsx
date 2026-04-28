import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — Canvas Buddy",
  description:
    "The agreement between you and Canvas Buddy when you use the service.",
};

const LAST_UPDATED = "April 28, 2026";

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 px-5 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <Section title="Plain language">
            <p>
              We render Spotify Canvas videos for you. You bring the artwork.
              We don't take ownership of anything you upload. Pay what we charge
              for the plan you pick. Don't use the service to do anything
              illegal or to abuse it. We can shut down accounts that break the
              rules. The service comes "as-is" — we'll do our best but not
              everything is guaranteed.
            </p>
          </Section>

          <Section title="The service">
            <p>
              Canvas Buddy ("we", "us") is a web application that renders 9:16
              vertical looping MP4 videos suitable for upload as Spotify Canvas
              clips. The service is operated by 55 Music.
            </p>
          </Section>

          <Section title="Your account">
            <p>
              You need a Canvas Buddy account to render and download videos.
              You're responsible for keeping your sign-in credentials safe and
              for activity under your account. You must be at least 13 years
              old.
            </p>
          </Section>

          <Section title="Your content">
            <p>
              You own what you upload and what we render for you. Granting us a
              license to host and serve your files is implicit in using the
              product — we need it to render your video and serve it back to
              you — but we don't claim ownership and don't repurpose your
              content for marketing or model training.
            </p>
            <p>
              You represent that you have the rights to anything you upload.
              We'll cooperate with valid takedown requests for content that
              infringes third-party rights.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to:</p>
            <ul>
              <li>upload content that's illegal, infringing, or hateful</li>
              <li>
                attempt to abuse the AI image generator (sock-puppet signups,
                automated scripting, prompts targeting other people without
                consent)
              </li>
              <li>
                attempt to bypass quota enforcement, watermarks, or payment
              </li>
              <li>
                resell or redistribute access to Canvas Buddy as your own
                service
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that
              violate these rules.
            </p>
          </Section>

          <Section title="Plans and billing">
            <p>
              Free, Per Canvas ($4.99 per video), and Pro ($9.99/month) tiers
              are described on{" "}
              <Link href="/#pricing">the pricing section</Link>. Subscriptions
              renew automatically until cancelled. Cancel anytime via the
              Manage subscription link in the app — you keep Pro access until
              the end of the current billing period.
            </p>
            <p>
              Per-canvas purchases are non-refundable except where the rendered
              file fails our spec validator (in which case we'll refund or
              re-render at your choice). Subscription charges are non-prorated
              on cancellation. For exceptional circumstances email us.
            </p>
            <p>
              Prices may change. We'll give 30 days' notice via email before
              changing the price of an active plan.
            </p>
          </Section>

          <Section title="Service availability">
            <p>
              We aim for high availability but don't guarantee 100% uptime. The
              service may be unavailable for maintenance, third-party outages
              (Spotify, Stripe, Supabase, fal.ai), or unexpected issues. We're
              not liable for impact during outages.
            </p>
          </Section>

          <Section title="Spotify">
            <p>
              Canvas Buddy is independent and not affiliated with, endorsed by,
              or sponsored by Spotify AB. "Spotify" and "Spotify Canvas" are
              trademarks of Spotify AB. We render files that meet Spotify's
              published Canvas spec; we have no role in Spotify's review or
              acceptance of uploaded content.
            </p>
          </Section>

          <Section title="Termination">
            <p>
              You can delete your account anytime by emailing
              hi@canvasbuddy.io. We can suspend or terminate accounts that
              violate these terms or abuse the service. On termination your
              data is removed within 24 hours.
            </p>
          </Section>

          <Section title="No warranty">
            <p>
              The service is provided "as is" and "as available" without
              warranties of any kind. We don't guarantee any specific outcome
              (a Canvas being accepted by Spotify, a render matching your
              creative intent, etc.).
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, our total liability is
              limited to the amount you paid us in the 12 months before the
              claim arose, or US$50, whichever is greater. We are not liable
              for indirect or consequential damages.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These terms are governed by the laws of the jurisdiction where
              55 Music is based. Disputes resolve in the courts of that
              jurisdiction.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              When we update these terms we'll bump the date at the top and
              email active subscribers if the change is material. Continued
              use after the update is acceptance.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions:{" "}
              <a
                href="mailto:hi@canvasbuddy.io"
                className="text-[var(--color-accent)] hover:underline"
              >
                hi@canvasbuddy.io
              </a>
            </p>
          </Section>

          <div className="mt-16 text-center">
            <Link
              href="/"
              className="text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">
        {title}
      </h2>
      <div className="text-sm text-[var(--color-ink-dim)] leading-relaxed space-y-3 [&_a]:text-[var(--color-accent)] [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
