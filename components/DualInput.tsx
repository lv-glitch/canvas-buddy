export function DualInput() {
  return (
    <section className="px-5 sm:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Start with a photo, or just an idea.
          </h2>
          <p className="mt-3 text-[var(--color-ink-dim)] max-w-xl mx-auto">
            Two ways in. Same Canvas-ready output.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {/* Upload card — green accent */}
          <div className="relative group">
            <div
              className="absolute -inset-px rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--color-accent)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-md"
              aria-hidden="true"
            />
            <div className="relative rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 h-full">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-xs font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                Upload
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight">
                Upload your image
              </h3>
              <p className="mt-2 text-[var(--color-ink-dim)] text-sm">
                Album art, a photo, a snapshot — drop it in.
              </p>

              {/* Mock drag-and-drop zone */}
              <div className="mt-6 rounded-[var(--radius-card)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/40 aspect-[4/5] flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Drag and drop here
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  or click to browse — JPG, PNG, WEBP
                </p>
              </div>
            </div>
          </div>

          {/* AI card — purple accent */}
          <div className="relative group">
            <div
              className="absolute -inset-px rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--color-purple)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-md"
              aria-hidden="true"
            />
            <div className="relative rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 h-full">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--color-purple)]/15 text-[var(--color-purple)] text-xs font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-purple)]" />
                AI
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight">
                Generate with AI
              </h3>
              <p className="mt-2 text-[var(--color-ink-dim)] text-sm">
                Describe the image you want. We'll generate it.
              </p>

              {/* Mock prompt input */}
              <div className="mt-6 rounded-[var(--radius-card)] bg-[var(--color-bg)] border border-[var(--color-border)] p-4 aspect-[4/5] flex flex-col">
                <div className="flex-1 text-sm text-[var(--color-ink-dim)] leading-relaxed">
                  <span className="text-[var(--color-ink)]">
                    Moody portrait, neon-lit city alley at night,
                  </span>{" "}
                  cinematic 35mm film, vertical composition with strong negative space…
                  <span className="inline-block w-1.5 h-4 bg-[var(--color-purple)] ml-0.5 align-middle animate-pulse" aria-hidden="true" />
                </div>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-purple)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--color-purple-hover)] transition-colors"
                >
                  ✨ Generate Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
