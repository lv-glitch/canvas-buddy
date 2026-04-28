"use client";

import { useRef, useState } from "react";

const TOOL_API =
  process.env.NEXT_PUBLIC_TOOL_API || "http://localhost:3737";

interface DualInputProps {
  /** Called when the user picks a file (upload) or finishes an AI generation.
   *  The File becomes the source image for the Pick-a-vibe demo below. */
  onPickFile: (file: File) => void;
}

export function DualInput({ onPickFile }: DualInputProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiBusy, setAIBusy] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  function pickViaInput() {
    fileInput.current?.click();
  }

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    onPickFile(f);
    scrollToVibe();
  }

  async function aiGenerate() {
    if (aiBusy || !aiPrompt.trim()) return;
    setAIBusy(true);
    setAIError(null);
    try {
      const r = await fetch(`${TOOL_API}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Generate failed (HTTP ${r.status})`);
      }
      const blob = await r.blob();
      onPickFile(new File([blob], "ai.png", { type: "image/png" }));
      scrollToVibe();
    } catch (e) {
      setAIError(e instanceof Error ? e.message : String(e));
    } finally {
      setAIBusy(false);
    }
  }

  return (
    <section className="px-5 sm:px-8 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Start with a photo or an idea.
          </h2>
          <p className="mt-3 text-[var(--color-ink-dim)] max-w-xl mx-auto">
            Upload your artwork or describe what you want — AI handles the rest.
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
                Option 1
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight">
                Upload your image
              </h3>
              <p className="mt-2 text-[var(--color-ink-dim)] text-sm">
                Album art, a photo, a snapshot — drop it in.
              </p>

              <button
                type="button"
                onClick={pickViaInput}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={[
                  "mt-6 w-full rounded-[var(--radius-card)] border-2 border-dashed bg-[var(--color-surface-2)]/40 aspect-[4/5] flex flex-col items-center justify-center text-center px-4 transition-colors cursor-pointer",
                  dragOver
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/60",
                ].join(" ")}
                aria-label="Upload an image"
              >
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
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
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
                Option 2
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight">
                Generate with AI
              </h3>
              <p className="mt-2 text-[var(--color-ink-dim)] text-sm">
                Describe the image you want. We&rsquo;ll generate it.
              </p>

              <div className="mt-6 rounded-[var(--radius-card)] bg-[var(--color-bg)] border border-[var(--color-border)] p-4 aspect-[4/5] flex flex-col">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAIPrompt(e.target.value)}
                  disabled={aiBusy}
                  placeholder="dark moody cityscape at night, neon reflections on wet streets, cinematic…"
                  className="flex-1 bg-transparent text-sm text-[var(--color-ink)] leading-relaxed placeholder-[var(--color-ink-muted)] resize-none outline-none disabled:opacity-60"
                />
                {aiError && (
                  <p className="text-[11px] text-[#ff6b6b] mb-2">{aiError}</p>
                )}
                <button
                  type="button"
                  onClick={aiGenerate}
                  disabled={aiBusy || !aiPrompt.trim()}
                  className="mt-3 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-purple)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--color-purple-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiBusy ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function scrollToVibe() {
  // Defer one frame so the new image has a chance to mount in Pick-a-vibe
  // before we scroll there.
  requestAnimationFrame(() => {
    document.getElementById("vibe")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
