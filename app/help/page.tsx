import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Help — Canvas Buddy",
  description:
    "FAQ for Canvas Buddy: Spotify Canvas specs, upload steps, billing, and account questions.",
};

interface QA {
  q: string;
  a: React.ReactNode;
}

const SECTIONS: { title: string; items: QA[] }[] = [
  {
    title: "Spotify Canvas basics",
    items: [
      {
        q: "What is a Spotify Canvas?",
        a: (
          <p>
            A 3–8 second looping vertical video that plays behind your track
            on Spotify mobile. It replaces the static album art for that song
            and is one of the few visual touchpoints listeners have inside
            the player.
          </p>
        ),
      },
      {
        q: "What's the spec?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>9:16 vertical, 1080×1920 (or 720×1280 minimum)</li>
            <li>3–8 seconds, looping seamlessly</li>
            <li>H.264 in an MP4 container, no audio</li>
            <li>Under 8 MB</li>
          </ul>
        ),
      },
      {
        q: "Will my Canvas be rejected if it misses spec?",
        a: (
          <p>
            We run every render through a spec validator (ffprobe) before
            shipping it to your library. If the file misses a single spec
            requirement (dimensions, codec, duration, color tags, file
            size), we fail loudly with the violation rather than letting
            Spotify silently reject it on upload.
          </p>
        ),
      },
    ],
  },
  {
    title: "Uploading to Spotify",
    items: [
      {
        q: "How do I upload my Canvas to Spotify?",
        a: (
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Download your MP4 from Canvas Buddy (the download icon on any
              canvas in your library).
            </li>
            <li>
              Go to{" "}
              <a
                href="https://artists.spotify.com/canvas"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                artists.spotify.com/canvas
              </a>
              {" "}and sign in.
            </li>
            <li>Find the track you want to add a Canvas to.</li>
            <li>
              Click <em>Add Canvas</em> → upload the MP4 → save.
            </li>
            <li>
              Spotify usually shows the new Canvas within minutes, sometimes
              up to an hour.
            </li>
          </ol>
        ),
      },
      {
        q: "Do I need to be a verified artist?",
        a: (
          <p>
            Yes — Canvas is a Spotify for Artists feature, so you need a
            claimed artist profile. New release? Apply via your distributor
            (DistroKid, TuneCore, CD Baby, etc.) before adding Canvases.
          </p>
        ),
      },
    ],
  },
  {
    title: "Pricing & billing",
    items: [
      {
        q: "What are the plans?",
        a: (
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Free</strong> — 5 canvases/month with a small
              Canvas Buddy watermark. 3 AI image generations/month.
            </li>
            <li>
              <strong>Per Canvas — $4.99</strong> per video. Removes the
              watermark on a single canvas. No subscription.
            </li>
            <li>
              <strong>Pro — $9.99/month</strong>. Unlimited canvases, no
              watermark, unlimited AI generations.
            </li>
          </ul>
        ),
      },
      {
        q: "How does the per-canvas $4.99 work?",
        a: (
          <p>
            Render with the watermark for free. If you like a specific
            canvas and want to use it on Spotify, click <em>Remove
            watermark $4.99</em> in the download dialog. We re-render it
            without the watermark and email you when it's ready (usually
            within a few seconds).
          </p>
        ),
      },
      {
        q: "Can I cancel Pro anytime?",
        a: (
          <p>
            Yes. In the app, click <em>Manage subscription</em> → Stripe's
            self-serve portal. You stay Pro until the end of your current
            billing period, then revert to Free automatically.
          </p>
        ),
      },
      {
        q: "Refunds?",
        a: (
          <p>
            For per-canvas purchases: if a render genuinely doesn't pass our
            spec validator and we ship a broken file, refund on request. For
            subscriptions: prorated refunds aren't standard but reach out at{" "}
            <a
              href="mailto:hi@canvasbuddy.io"
              className="text-[var(--color-accent)] hover:underline"
            >
              hi@canvasbuddy.io
            </a>{" "}
            with the issue and we'll work it out.
          </p>
        ),
      },
    ],
  },
  {
    title: "Account & data",
    items: [
      {
        q: "Where are my canvases stored?",
        a: (
          <p>
            Source images and rendered MP4s are stored in Supabase Storage
            (US-East). They're accessible only via short-lived signed URLs
            tied to your account.
          </p>
        ),
      },
      {
        q: "Can I delete my data?",
        a: (
          <p>
            Click the trash icon on any canvas in your library — the row
            and the underlying MP4/thumbnail are removed immediately. To
            delete your whole account, email{" "}
            <a
              href="mailto:hi@canvasbuddy.io"
              className="text-[var(--color-accent)] hover:underline"
            >
              hi@canvasbuddy.io
            </a>{" "}
            and we'll wipe it within 24h.
          </p>
        ),
      },
      {
        q: "Is Canvas Buddy affiliated with Spotify?",
        a: (
          <p>
            No. We just build the file Spotify expects, so you can spend
            time making music instead of fighting FFmpeg. Spotify is a
            trademark of Spotify AB.
          </p>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 px-5 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <header className="text-center mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Help & FAQ
            </h1>
            <p className="mt-4 text-[var(--color-ink-dim)]">
              The short version of how Canvas Buddy works. Anything missing?{" "}
              <a
                href="mailto:hi@canvasbuddy.io"
                className="text-[var(--color-accent)] hover:underline"
              >
                Email us.
              </a>
            </p>
          </header>

          {SECTIONS.map((section) => (
            <section key={section.title} className="mb-12 sm:mb-14">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-5">
                {section.title}
              </h2>
              <div className="space-y-6">
                {section.items.map(({ q, a }) => (
                  <div
                    key={q}
                    className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6"
                  >
                    <h3 className="font-semibold text-[var(--color-ink)]">{q}</h3>
                    <div className="mt-3 text-sm text-[var(--color-ink-dim)] leading-relaxed">
                      {a}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

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
