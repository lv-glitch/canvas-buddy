// Spec-faithful Spotify mobile-player mockups. Drop new artwork into
// public/examples/ and update the array below — no other code changes.
const PHONES: PhoneConfig[] = [
  { image: "/examples/canvas1.jpg", title: "Song Title 1", artist: "Artist 1", effect: "Zoom + Noir" },
  { image: "/examples/canvas2.jpg", title: "Song Title 2", artist: "Artist 2", effect: "Drift + Coast" },
  { image: "/examples/canvas3.jpg", title: "Song Title 3", artist: "Artist 3", effect: "Pulse + Golden Hour" },
  { image: "/examples/canvas4.jpg", title: "Song Title 4", artist: "Artist 4", effect: "Glitch + VHS" },
];

interface PhoneConfig {
  image: string;
  title: string;
  artist: string;
  effect: string;
}

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

function Phone({ image, title, artist, effect }: PhoneConfig) {
  return (
    <figure className="flex flex-col items-center gap-3">
      <div
        className="relative bg-black overflow-hidden"
        style={{
          width: "128px",
          height: "254px",
          borderRadius: "18px",
          border: "2px solid #333",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

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
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-2.5 pt-2.5 text-white/85">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="text-[6px] font-semibold tracking-[0.12em] uppercase">
            Playing from playlist
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </div>

        {/* Bottom: title + artist + scrub + transport */}
        <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 text-white">
          <p className="font-bold leading-tight" style={{ fontSize: "10px" }}>
            {title}
          </p>
          <p
            className="leading-tight mt-0.5"
            style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)" }}
          >
            {artist}
          </p>

          {/* Progress bar — ~35% played */}
          <div
            className="mt-2 rounded-full overflow-hidden"
            style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.25)" }}
          >
            <div
              className="h-full bg-white"
              style={{ width: "35%" }}
            />
          </div>

          {/* Transport: skip back / play / skip forward */}
          <div className="mt-2 flex items-center justify-center gap-3 text-white">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="20 4 9 12 20 20 20 4" />
              <rect x="5" y="4" width="2" height="16" />
            </svg>
            <span
              className="rounded-full bg-white text-black flex items-center justify-center"
              style={{ width: "18px", height: "18px" }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="4 4 15 12 4 20 4 4" />
              <rect x="17" y="4" width="2" height="16" />
            </svg>
          </div>
        </div>
      </div>

      <figcaption className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] font-medium">
        {effect}
      </figcaption>
    </figure>
  );
}
