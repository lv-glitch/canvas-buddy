import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Canvas Buddy",
  description: "How Canvas Buddy collects, stores, and uses your data.",
};

const LAST_UPDATED = "April 28, 2026";

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 px-5 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl prose-section">
          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <Section title="What we collect">
            <p>When you use Canvas Buddy we collect:</p>
            <ul>
              <li>
                <strong>Account info</strong> — email address and authentication
                state, handled by our auth provider Clerk.
              </li>
              <li>
                <strong>Source artwork</strong> — images you upload or generate
                with AI to render into a Canvas video.
              </li>
              <li>
                <strong>Rendered output</strong> — the MP4 we render for you,
                plus a thumbnail.
              </li>
              <li>
                <strong>Usage state</strong> — counters for your monthly video
                and AI-generation quotas.
              </li>
              <li>
                <strong>Billing info</strong> — handled entirely by Stripe; we
                store only the customer/subscription identifier and your plan.
                We never see your card number.
              </li>
              <li>
                <strong>Server logs</strong> — IP address, user agent, request
                paths, retained for ~30 days to debug abuse and outages.
              </li>
            </ul>
          </Section>

          <Section title="How we use it">
            <p>
              We use your data only to operate Canvas Buddy: render your
              videos, enforce quotas, bill your plan, send transactional emails
              (Pro upgrade confirmation, watermark-removal receipts), and
              prevent abuse.
            </p>
            <p>
              We do not sell your data. We do not show ads. We do not train AI
              models on your content.
            </p>
          </Section>

          <Section title="Where it's stored">
            <p>
              Source images, rendered MP4s, and thumbnails live in Supabase
              Storage (US-East). Account metadata and usage counters live in
              Supabase Postgres. Payment data lives at Stripe. Authentication
              state lives at Clerk.
            </p>
            <p>
              All requests are TLS-encrypted in transit. Storage objects are
              private — your videos are only accessible via short-lived signed
              URLs tied to your account.
            </p>
          </Section>

          <Section title="Sub-processors">
            <ul>
              <li>
                <strong>Clerk</strong> — authentication
              </li>
              <li>
                <strong>Supabase</strong> — database + file storage
              </li>
              <li>
                <strong>Stripe</strong> — payments + subscription billing
              </li>
              <li>
                <strong>Fly.io</strong> — server hosting
              </li>
              <li>
                <strong>Cloudflare Turnstile</strong> — bot prevention
              </li>
              <li>
                <strong>fal.ai</strong> — AI image generation (Flux Pro 1.1)
              </li>
              <li>
                <strong>Resend</strong> — transactional email
              </li>
            </ul>
          </Section>

          <Section title="Your rights">
            <p>
              <strong>Access</strong> — your library at canvasbuddy.io/app is
              the current view of everything we hold about you that's
              user-facing.
            </p>
            <p>
              <strong>Deletion</strong> — click the trash icon on any canvas in
              your library to remove the row and underlying files
              immediately. To delete your entire account and all associated
              data, email{" "}
              <a href="mailto:hi@canvasbuddy.io">hi@canvasbuddy.io</a> — we
              act within 24 hours.
            </p>
            <p>
              <strong>Portability</strong> — download your MP4s anytime from
              the library; that's all the user-generated content we hold.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              We use only first-party cookies needed for authentication and
              session management (set by Clerk). No tracking cookies, no
              third-party advertising cookies.
            </p>
          </Section>

          <Section title="Children">
            <p>
              Canvas Buddy is not intended for users under 13. We don't
              knowingly collect data from children. If you believe a child has
              created an account, email us and we'll remove it.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              When we update this policy, we'll bump the date at the top and
              email anyone with an active subscription if the change is
              material.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Privacy questions:{" "}
              <a href="mailto:hi@canvasbuddy.io">hi@canvasbuddy.io</a>
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
      <div className="text-sm text-[var(--color-ink-dim)] leading-relaxed space-y-3 [&_strong]:text-[var(--color-ink)] [&_a]:text-[var(--color-accent)] [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
