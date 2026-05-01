"use client";

import { useEffect, useRef, useState } from "react";

interface CenterPanelProps {
  sourceURL: string | null;
  effect: string;
  filter: string;
  duration: number;
  isGenerating: boolean;
  onGenerate: () => void;
  onReset: () => void;
  onDownload: () => void;
  resultURL: string | null;
  effectLabel: string;
  filterLabel: string;
  renderError: string | null;
  /** Selected canvas name shown above the preview, editable. Pass null
   *  when no library row is selected (e.g. mid-generation, fresh state)
   *  and the title field will be hidden. */
  selectedName: string | null;
  onRenameSelected: (name: string) => void;
}

// CSS approximations of each backend filter, tuned to match the strength of
// the FFmpeg renders. Not pixel-perfect — CSS can't do per-channel curves or
// colorbalance — but close enough for the live preview to read as the right
// vibe. If you change a backend filter, bump these to match.
const FILTER_CSS: Record<string, string> = {
  none:       "none",
  goldenhour: "saturate(1.55) contrast(1.30) brightness(1.05) hue-rotate(3deg)",
  sunkissed:  "saturate(1.42) brightness(1.08) contrast(1.15) hue-rotate(8deg)",
  coast:      "saturate(0.85) contrast(1.10) hue-rotate(15deg) brightness(1.05)",
  softwash:   "saturate(0.55) contrast(0.88) brightness(1.05)",
  parisian:   "saturate(0.85) contrast(0.85) sepia(0.20) hue-rotate(-12deg) brightness(1.05)",
  analog:     "saturate(0.95) sepia(0.30) contrast(0.85) brightness(1.05)",
  noir:       "grayscale(1) contrast(1.45) brightness(0.95)",
  retro:      "sepia(0.45) saturate(1.10) hue-rotate(-15deg) contrast(0.92) brightness(1.05)",
  vhs:        "saturate(0.85) contrast(0.95) hue-rotate(-4deg) blur(0.4px)",
  polaroid:   "saturate(0.78) contrast(0.88) sepia(0.18) hue-rotate(-6deg) brightness(1.06)",
  softfocus:  "saturate(0.92) brightness(1.04) blur(1.5px) contrast(0.88)",
  glitch:     "saturate(1.4) contrast(1.20) hue-rotate(0deg)", // overridden by cb-glitch-flicker keyframe
  shimmer:    "saturate(1.05) brightness(1.05)",
};

// CSS keyframe name for each effect — declared in app/globals.css.
const EFFECT_ANIM: Record<string, string> = {
  zoom:     "cb-zoom",
  drift:    "cb-drift",
  pulse:    "cb-pulse",
  kenburns: "cb-kenburns",
  tilt:     "cb-tilt",
  vertigo:  "cb-vertigo",
  glow:     "cb-glow",
  rotate:   "cb-rotate",
};

// Per-effect timing function. Most effects oscillate (ease-in-out reads as
// natural breathing/swaying), but `rotate` is a continuous spin and needs
// linear to avoid the slow-fast-slow stutter.
const EFFECT_TIMING: Record<string, string> = {
  rotate: "linear",
};

// Per-effect animation-duration override (in seconds). For most effects we
// match the canvas duration so one keyframe cycle = one canvas loop. Pulse
// and glow are different on the backend: they run at fixed cadences (2
// beats/sec for pulse, 1 throb/sec for glow) regardless of canvas duration,
// because the backend formulas are time-based, not phase-based. The live
// preview pins these to the same fixed cycle so what the user sees matches
// what they'll get.
const EFFECT_DURATION_S: Record<string, number> = {
  pulse: 0.5, // 2 beats per second
  glow:  1.0, // 1 throb per second
};

export function CenterPanel({
  sourceURL,
  effect,
  filter,
  duration,
  isGenerating,
  onGenerate,
  onReset,
  onDownload,
  resultURL,
  effectLabel,
  filterLabel,
  renderError,
  selectedName,
  onRenameSelected,
}: CenterPanelProps) {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0..1
  const animRef = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  // Drive the scrubber position from a requestAnimationFrame loop so the
  // visual preview clock and the timestamp text stay in sync.
  useEffect(() => {
    if (!sourceURL || !playing) {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      return;
    }
    function tick(now: number) {
      if (startTime.current === null) startTime.current = now;
      const elapsed = ((now - startTime.current) / 1000) % duration;
      setProgress(elapsed / duration);
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [sourceURL, playing, duration]);

  // Restart the timer whenever the effect/duration/source changes so the
  // preview animation visibly resets.
  useEffect(() => {
    startTime.current = null;
    setProgress(0);
  }, [effect, duration, sourceURL]);

  const isGlitch = filter === "glitch";
  const isGlow = effect === "glow";
  // When glitch is selected, the filter property is animated by a keyframe
  // (cb-glitch-flicker), so the static `filter:` style must be cleared or it
  // would override the animation. For every other filter we set it directly.
  const css = isGlitch ? undefined : FILTER_CSS[filter] || "none";
  const animName = EFFECT_ANIM[effect] || "none";
  const animTiming = EFFECT_TIMING[effect] || "ease-in-out";
  const animDurationS = EFFECT_DURATION_S[effect] ?? duration;
  const animation = playing
    ? [
        `${animName} ${animDurationS}s ${animTiming} infinite`,
        // 2.5s cycle, linear so the keyframe-spaced "snap" transitions read
        // as TV interference rather than smooth color shifts.
        isGlitch ? "cb-glitch-flicker 2.5s linear infinite" : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "none";
  const elapsed = (progress * duration).toFixed(1);

  return (
    <main className="flex-1 bg-[#0e0e0e] overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="w-[280px] flex flex-col gap-4">
          {/* Title — editable, becomes the download filename */}
          {selectedName !== null && (
            <CanvasTitleField name={selectedName} onSave={onRenameSelected} />
          )}

          {/* Preview tile — 9:16 vertical, matches Spotify Canvas spec */}
          <div
            className="relative w-[280px] aspect-[9/16] rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden flex items-center justify-center"
          >
            {resultURL ? (
              // Real backend render — actual MP4. Skip the CSS approximations.
              <video
                src={resultURL}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                onContextMenu={(e) => e.preventDefault()}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : sourceURL ? (
              <>
                <img
                  src={sourceURL}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: css, animation }}
                />
                {/* Glow halation overlay — radial bright glow with a 1Hz
                    opacity throb, lighten-blended on top of the look-
                    filtered photo. Matches the backend's post-filter
                    bloom pass without disturbing the look filter's
                    color grade. */}
                {isGlow && playing && (
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.35) 40%, rgba(255,255,255,0) 75%)",
                      mixBlendMode: "lighten",
                      animation: "cb-glow-throb 1s ease-in-out infinite",
                    }}
                  />
                )}
              </>
            ) : (
              <div className="text-center px-6">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] mx-auto flex items-center justify-center mb-3 text-[var(--color-ink-muted)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  Start with a photo
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                  Upload one in the left panel — or click <em>AI</em> and
                  describe what you want.
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <span
                  className="inline-block w-7 h-7 rounded-full border-2 border-white/20 border-t-[var(--color-accent)]"
                  style={{ animation: "cb-spin .8s linear infinite" }}
                />
                <p className="mt-3 text-sm font-medium">Rendering canvas…</p>
              </div>
            )}
          </div>

          {/* Scrubber + play */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={!sourceURL}
              className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-ink-muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              aria-label={playing ? "Pause preview" : "Play preview"}
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              )}
            </button>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-[var(--color-ink-muted)] tabular-nums w-14 text-right">
              {elapsed}s / {duration.toFixed(1)}s
            </span>
          </div>

          {/* Spec readout */}
          <p className="text-[11px] text-[var(--color-ink-muted)] tracking-wide uppercase text-center">
            1080 × 1920 · 9:16 · MP4 · {duration.toFixed(1)}s · {effectLabel} ·{" "}
            {filterLabel}
          </p>

          {/* Generate */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={!sourceURL || isGenerating}
            className="w-full inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)] disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating…" : "Generate Canvas"}
          </button>

          {/* Download / Reset */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onDownload}
              disabled={!resultURL}
              className="inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-xs font-semibold hover:border-[var(--color-ink-dim)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download MP4
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-xs font-semibold hover:border-[var(--color-ink-dim)] transition-colors"
            >
              Reset
            </button>
          </div>

          {renderError && (
            <p className="text-[12px] text-[#ff6b6b] leading-snug whitespace-pre-wrap">
              {renderError}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function CanvasTitleField({
  name,
  onSave,
}: {
  name: string;
  onSave: (next: string) => void;
}) {
  const [draft, setDraft] = useState(name);
  // Keep draft in sync when the parent renames externally (e.g. user
  // edits the same canvas in the library row).
  useEffect(() => { setDraft(name); }, [name]);

  function commit() {
    const next = draft.trim();
    if (next && next !== name) onSave(next);
    else setDraft(name);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") { setDraft(name); (e.target as HTMLInputElement).blur(); }
        }}
        maxLength={80}
        className="flex-1 bg-transparent text-sm font-semibold text-[var(--color-ink)] border-b border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors"
        title="Click to rename"
      />
    </div>
  );
}
