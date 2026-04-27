"use client";

export interface SavedCanvas {
  id: string;
  name: string;
  effect: string;
  filter: string;
  duration: number;
  thumbnailURL: string;
  videoURL: string;
}

interface RightPanelProps {
  canvases: SavedCanvas[];
  plan: "free" | "percanvas" | "pro";
  onDownload: (c: SavedCanvas) => void;
  onDelete: (id: string) => void;
}

export function RightPanel({
  canvases,
  plan,
  onDownload,
  onDelete,
}: RightPanelProps) {
  const isPro = plan === "pro";

  return (
    <aside className="w-[240px] flex-shrink-0 border-l border-[var(--color-border)] bg-[#0a0a0a] overflow-y-auto">
      <div className="p-5 space-y-6">
        <Section title="My canvas videos">
          {canvases.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)] py-2">
              No videos yet. Generate one to start your library.
            </p>
          ) : (
            <ul className="space-y-2">
              {canvases.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2.5 p-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-ink-muted)] transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded flex-shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${c.thumbnailURL})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-[var(--color-ink-muted)] truncate uppercase tracking-wider">
                      {c.effect} · {c.filter}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDownload(c)}
                    className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors flex-shrink-0"
                    aria-label="Download canvas"
                    title="Download"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(c.id)}
                    className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[#ff6b6b] hover:bg-[var(--color-surface-2)] transition-colors flex-shrink-0"
                    aria-label="Delete canvas"
                    title="Delete"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Batch upload"
          right={
            !isPro && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                Pro
              </span>
            )
          }
        >
          <div
            className={[
              "rounded-md border-2 border-dashed p-3 text-center",
              isPro
                ? "border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer"
                : "border-[var(--color-border)] opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            <p className="text-xs font-medium">
              {isPro ? "Drop multiple images" : "Upgrade to Pro"}
            </p>
            <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">
              {isPro
                ? "Render a whole batch at once"
                : "Render whole batches at once"}
            </p>
          </div>
        </Section>

        <Section title="Quick tip">
          <div className="text-[12px] text-[var(--color-ink-dim)] leading-relaxed space-y-2">
            <p>
              Once you have your MP4, head to{" "}
              <a
                href="https://artists.spotify.com/canvas"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                Spotify for Artists
              </a>
              , find the track, click <em>Add Canvas</em>, and upload the file.
            </p>
            <p className="text-[var(--color-ink-muted)] text-[11px]">
              Spotify Canvas requires 9:16 vertical, 3-8 seconds, looping.
              We handle the spec for you.
            </p>
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
}
