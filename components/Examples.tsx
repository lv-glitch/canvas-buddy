import { readdir } from "node:fs/promises";
import path from "node:path";

const EXAMPLE_DIR = path.join(process.cwd(), "public", "examples");
const VIDEO_RE = /\.(mp4|webm)$/i;

async function listExamples() {
  try {
    const files = await readdir(EXAMPLE_DIR);
    return files.filter((f) => VIDEO_RE.test(f)).sort();
  } catch {
    return [];
  }
}

// Filename convention: `<order>-<Artist Words>--<Track Words>.mp4`
//   - leading "01-" / "02-" for sort order (stripped from label)
//   - single hyphen separates words within artist or track
//   - DOUBLE hyphen separates artist from track
//   - filename case is preserved verbatim (so "stelle e luna" stays lowercase)
//
// Falls back to a permissive split for older files.
function labelFromFilename(name: string) {
  const stem = name
    .replace(VIDEO_RE, "")
    .replace(/^\d+[-_\s]+/, "")
    .replace(/[-_]canvas$/i, "");

  if (stem.includes("--")) {
    const [artist, ...rest] = stem.split("--");
    const track = rest.join("--").replace(/-/g, " ");
    return `${artist.replace(/-/g, " ")} — ${track}`;
  }
  // Legacy / unstructured filename: just clean separators, leave case alone.
  return stem.replace(/[-_]+/g, " ");
}

export async function Examples() {
  const files = await listExamples();

  return (
    <section id="examples" className="px-5 sm:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            See it in motion.
          </h2>
          <p className="mt-3 text-[var(--color-ink-dim)] max-w-xl mx-auto">
            Real canvases generated with Canvas Buddy. All looping, all 9:16.
          </p>
        </div>

        {files.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {files.map((file) => (
              <ExampleTile key={file} file={file} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExampleTile({ file }: { file: string }) {
  return (
    <figure className="group relative">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
        <video
          src={`/examples/${encodeURIComponent(file)}`}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
        <figcaption className="absolute bottom-2 left-3 right-3 text-[11px] uppercase tracking-wider text-white/85 font-medium">
          {labelFromFilename(file)}
        </figcaption>
      </div>
    </figure>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-12 text-center">
      <p className="text-[var(--color-ink)] font-medium">
        No examples yet.
      </p>
      <p className="mt-2 text-sm text-[var(--color-ink-dim)] max-w-md mx-auto">
        Drop any{" "}
        <code className="text-[var(--color-accent)]">.mp4</code> or{" "}
        <code className="text-[var(--color-accent)]">.webm</code> files into{" "}
        <code className="text-[var(--color-accent)]">public/examples/</code>{" "}
        and they'll appear here automatically.
      </p>
    </div>
  );
}
