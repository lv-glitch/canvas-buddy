// Spec-faithful Spotify mobile-player mockups. Edit this array to swap
// artwork — drop the file in /public/examples/ and reference it here.
// `media` accepts both .mp4 (looped, autoplaying) and image paths.
// `effect` is the "Effect + Filter" caption shown below each phone — if
// you don't know the real settings yet, leave it empty and nothing renders.
const PHONES: PhoneConfig[] = [
  {
    media: "/examples/01-Same-Soul--Out-of-Nowhere.mp4",
    title: "Out of Nowhere",
    artist: "Same Soul",
    effect: "",
  },
  {
    media: "/examples/02-Sonya--All-Over-Me.mp4",
    title: "All Over Me",
    artist: "Sonya",
    effect: "",
  },
  {
    media: "/examples/03-stelle-e-luna--Delicate.mp4",
    title: "Delicate",
    artist: "stelle e luna",
    effect: "",
  },
  {
    media: "/examples/04-Norah-Brown--Let-It.mp4",
    title: "Let It",
    artist: "Norah Brown",
    effect: "",
  },
];

interface PhoneConfig {
  media: string;
  title: string;
  artist: string;
  effect?: string;
}

const VIDEO_RE = /\.(mp4|webm|mov)$/i;

export function Examples() {
  return (
    <section id="examples" className="px-5 sm:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            See it on Spotify.
          </h2>
          <p className="mt-3 text-[var(--color-ink-dim)] max-w-xl mx-auto">
            This is how your Canvas looks on the mobile player.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {PHONES.map((p) => (
            <Phone key={p.title} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Phone({ media, title, artist, effect }: PhoneConfig) {
  const isVideo = VIDEO_RE.test(media);
  return (
    <figure className="flex flex-col items-center gap-3">
      <div
        className="relative bg-black overflow-hidden"
        style={{
          width: "200px",
          height: "397px",
          borderRadius: "26px",
          border: "2px solid #333",
        }}
      >
        {isVideo ? (
          <video
            src={media}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Readability gradient — dark at the bottom, fades upward */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "40%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)",
          }}
        />

        {/* Top bar — down arrow / PLAYING FROM PLAYLIST / hamburger */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3.5 pt-3.5 text-white/85">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="text-[9px] font-semibold tracking-[0.14em] uppercase">
            Playing from playlist
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </div>

        {/* Bottom: title + artist + scrub + transport */}
        <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 text-white">
          <p className="font-bold leading-tight" style={{ fontSize: "15px" }}>
            {title}
          </p>
          <p
            className="leading-tight mt-1"
            style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}
          >
            {artist}
          </p>

          {/* Progress bar — ~35% played */}
          <div
            className="mt-3 rounded-full overflow-hidden"
            style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.25)" }}
          >
            <div className="h-full bg-white" style={{ width: "35%" }} />
          </div>

          {/* Transport: skip back / play / skip forward */}
          <div className="mt-3 flex items-center justify-center gap-5 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="20 4 9 12 20 20 20 4" />
              <rect x="5" y="4" width="2" height="16" />
            </svg>
            <span
              className="rounded-full bg-white text-black flex items-center justify-center"
              style={{ width: "28px", height: "28px" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="4 4 15 12 4 20 4 4" />
              <rect x="17" y="4" width="2" height="16" />
            </svg>
          </div>
        </div>
      </div>

      {effect ? (
        <figcaption className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] font-medium">
          {effect}
        </figcaption>
      ) : null}
    </figure>
  );
}
