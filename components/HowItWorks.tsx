const steps = [
  {
    n: "01",
    title: "Upload or generate",
    body:
      "Drop in album art or a photo, or describe what you want and let AI generate it.",
    color: "var(--color-accent)",
  },
  {
    n: "02",
    title: "Pick effect + filter",
    body: "8 animations. 13 filters. Pick one of each — no learning curve.",
    color: "var(--color-accent)",
  },
  {
    n: "03",
    title: "Download & upload",
    body:
      "Export a Spotify-spec MP4 and upload it through Spotify for Artists.",
    color: "var(--color-purple)",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-5 sm:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Three steps. About a minute.
          </h2>
          <p className="mt-3 text-[var(--color-ink-dim)] max-w-xl mx-auto">
            No editing software, no plugins, no rendering queue.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {steps.map(({ n, title, body, color }) => (
            <div
              key={n}
              className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-7"
            >
              <div
                className="text-sm font-mono tracking-widest"
                style={{ color }}
              >
                {n}
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-[var(--color-ink-dim)] text-[15px] leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
