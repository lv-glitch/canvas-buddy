"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Where the canvas-maker tool lives. In dev that's localhost:3737. For a real
// deploy, set NEXT_PUBLIC_TOOL_API at build time to the public URL.
const TOOL_API =
  process.env.NEXT_PUBLIC_TOOL_API || "http://localhost:3737";

// localStorage flag — easy to defeat with devtools, but discourages casual
// abuse and is the standard "free demo" pattern.
const USED_KEY = "cb-demo-used";

// Demo render uses the upper end of the 3-8 sec Canvas spec — feels generous
// without crossing Spotify's hard 8s limit.
const DEMO_DURATION = "7.9";

type Status = "idle" | "uploading" | "generating" | "done" | "locked" | "error";

interface FilterMeta {
  name: string;
  label: string;
}
interface AnimationMeta {
  name: string;
  description: string;
}

export function EffectPicker() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null); // server-side filter preview
  const [resultURL, setResultURL] = useState<string | null>(null);
  const [animation, setAnimation] = useState<string>("zoom");
  const [filter, setFilter] = useState<string>("none");
  const [animationList, setAnimationList] = useState<string[]>([]);
  const [filterList, setFilterList] = useState<string[]>([]);
  const [filterLabels, setFilterLabels] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewToken = useRef(0);

  // On mount: check whether they've already used their demo, and pull the
  // full animation + filter lists (with labels) from the tool. Single source
  // of truth — adding a new effect to the tool makes it appear in the demo.
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Visiting `/?reset=demo` clears the one-shot lock — useful for testing
      // and for "let me try again" cases. Strips the param after handling.
      const params = new URLSearchParams(window.location.search);
      if (params.has("reset")) {
        localStorage.removeItem(USED_KEY);
        const url = new URL(window.location.href);
        url.searchParams.delete("reset");
        window.history.replaceState({}, "", url.toString());
      } else if (localStorage.getItem(USED_KEY)) {
        setStatus("locked");
      }
    }
    fetch(`${TOOL_API}/api/options`)
      .then((r) => r.json())
      .then((data: { animations?: AnimationMeta[]; filters?: FilterMeta[] }) => {
        const anims = (data.animations || []).map((a) => a.name);
        const filts = (data.filters || []).map((f) => f.name);
        const labels: Record<string, string> = {};
        for (const f of data.filters || []) labels[f.name] = f.label;
        setAnimationList(anims);
        setFilterList(filts);
        setFilterLabels(labels);
      })
      .catch(() => {});
  }, []);

  function onPickFile(f: File | null | undefined) {
    if (!f) return;
    setErrorMsg("");
    setResultURL(null);
    setPhotoFile(f);
    if (photoURL) URL.revokeObjectURL(photoURL);
    setPhotoURL(URL.createObjectURL(f));
    void renderPreview(f, filter);
  }

  // Apply the current filter to a still preview so they see the look before
  // committing to the full canvas render.
  async function renderPreview(file: File, lookName: string) {
    const tok = ++previewToken.current;
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("filter", lookName);
      const r = await fetch(`${TOOL_API}/api/preview`, { method: "POST", body: fd });
      if (!r.ok || tok !== previewToken.current) return;
      const blob = await r.blob();
      if (previewURL) URL.revokeObjectURL(previewURL);
      setPreviewURL(URL.createObjectURL(blob));
    } catch {
      /* ignore — fall back to the raw photo URL */
    }
  }

  function onPickFilter(name: string) {
    if (status === "locked" || status === "generating") return;
    setFilter(name);
    if (photoFile) void renderPreview(photoFile, name);
  }

  function onPickAnimation(name: string) {
    if (status === "locked" || status === "generating") return;
    setAnimation(name);
  }

  async function onGenerate() {
    if (status === "locked" || status === "generating") return;
    if (!photoFile) {
      setErrorMsg("Pick a photo first.");
      return;
    }
    setErrorMsg("");
    setStatus("generating");
    try {
      const fd = new FormData();
      fd.append("image", photoFile);
      fd.append("animation", animation);
      fd.append("filter", filter);
      fd.append("layout", "fill");
      fd.append("duration", DEMO_DURATION);
      const r = await fetch(`${TOOL_API}/api/generate`, { method: "POST", body: fd });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${r.status}`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setResultURL(url);
      // Mark the demo as used. Free tier locks after one canvas.
      try { localStorage.setItem(USED_KEY, String(Date.now())); } catch {}
      setStatus("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  const isLocked = status === "locked";
  const isBusy = status === "generating";
  const showResult = !!resultURL;
  const previewSource = previewURL || photoURL;

  return (
    <section className="px-5 sm:px-8 py-16 sm:py-24 bg-[var(--color-surface)]/30">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Pick a vibe.
          </h2>
          <p className="mt-3 text-[var(--color-ink-dim)] max-w-xl mx-auto">
            Choose an animation effect and a color filter — try one free canvas
            right here.
          </p>
        </div>

        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-8">
          <div className="grid lg:grid-cols-[auto_1fr] gap-6 sm:gap-8">
            {/* Preview / result column */}
            <div className="lg:w-[260px] xl:w-[280px] flex-shrink-0 mx-auto lg:mx-0">
              <button
                type="button"
                onClick={() => !isLocked && !showResult && fileInputRef.current?.click()}
                disabled={isLocked || showResult || isBusy}
                className={[
                  "relative aspect-[9/16] w-full rounded-[var(--radius-card)] overflow-hidden",
                  "border border-[var(--color-border)] transition-colors",
                  showResult || previewSource
                    ? ""
                    : "bg-gradient-to-br from-[#B388FF]/15 via-[#1a1a1a] to-[#1ED760]/15 hover:border-[var(--color-accent)] cursor-pointer",
                  isLocked || showResult || isBusy ? "cursor-default" : "",
                ].join(" ")}
                aria-label="Upload a photo to preview"
              >
                {showResult ? (
                  <video
                    src={resultURL!}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls={false}
                    onContextMenu={(e) => e.preventDefault()}
                    {...({ controlslist: "nodownload" } as Record<string, string>)}
                    className="w-full h-full object-cover"
                  />
                ) : previewSource ? (
                  <img
                    src={previewSource}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      Drop a photo
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                      or click to pick one
                    </p>
                  </div>
                )}

                {isBusy && (
                  <div className="absolute inset-0 bg-black/55 backdrop-blur-sm flex flex-col items-center justify-center text-center text-white">
                    <Spinner />
                    <p className="mt-3 text-sm font-medium">Generating canvas…</p>
                    <p className="text-xs text-white/70 mt-1">~3-5 seconds</p>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/70 pointer-events-none">
                  <span>{showResult ? "Your canvas" : "Preview"}</span>
                  <span>1080 × 1920 · {showResult ? `${DEMO_DURATION}s` : "9:16"}</span>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
            </div>

            {/* Pickers + CTA column */}
            <div className="flex flex-col gap-6">
              <PillGroup
                title="Effect"
                values={animationList}
                selected={animation}
                onPick={onPickAnimation}
                disabled={isLocked || isBusy || showResult}
                labelFor={(v) => v[0].toUpperCase() + v.slice(1)}
                accent="green"
              />

              <PillGroup
                title="Filter"
                values={filterList}
                selected={filter}
                onPick={onPickFilter}
                disabled={isLocked || isBusy || showResult}
                labelFor={(v) =>
                  v === "none" ? "Original" : filterLabels[v] || v
                }
                accent="purple"
              />

              <div className="pt-2 mt-auto space-y-3">
                {/* Action area depends on current state */}
                {isLocked ? (
                  <LockedCTA />
                ) : showResult ? (
                  <DoneCTA />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onGenerate}
                      disabled={!photoFile || isBusy}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-ink-muted)] disabled:cursor-not-allowed"
                    >
                      {isBusy ? "Generating…" : "Generate Canvas"}
                    </button>
                    <p className="text-xs text-[var(--color-ink-muted)] tracking-wide">
                      9:16 vertical · 1080 × 1920 · 3–8 sec · MP4 · One free try
                    </p>
                    {errorMsg && (
                      <p className="text-xs text-[#ff6b6b]">{errorMsg}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PillGroup({
  title,
  values,
  selected,
  onPick,
  disabled,
  labelFor,
  accent = "green",
}: {
  title: string;
  values: string[];
  selected: string;
  onPick: (v: string) => void;
  disabled: boolean;
  labelFor: (v: string) => string;
  accent?: "green" | "purple";
}) {
  // Effect = green (full saturated bg + black text).
  // Filter = purple (translucent bg + purple text — softer per spec).
  const activeClasses =
    accent === "purple"
      ? "border-[var(--color-purple)]/40 text-[var(--color-purple)] font-semibold"
      : "bg-[var(--color-accent)] border-[var(--color-accent)] text-black font-semibold";
  const activeStyle =
    accent === "purple"
      ? { backgroundColor: "rgba(179,136,255,0.15)" }
      : undefined;
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => {
          const active = v === selected;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onPick(v)}
              disabled={disabled}
              style={active ? activeStyle : undefined}
              className={[
                "px-3.5 py-1.5 rounded-full text-sm border transition-colors",
                active
                  ? activeClasses
                  : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]",
                disabled && !active ? "opacity-50" : "",
                disabled ? "cursor-not-allowed" : "",
              ].join(" ")}
            >
              {labelFor(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DoneCTA() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/8 p-4">
      <p className="text-sm font-semibold text-[var(--color-ink)]">
        That&rsquo;s your free canvas.
      </p>
      <p className="text-xs text-[var(--color-ink-dim)] mt-1">
        Sign up to download, render unlimited canvases, and skip the watermark.
      </p>
      <Link
        href="#pricing"
        className="mt-3 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors"
      >
        See plans
      </Link>
    </div>
  );
}

function LockedCTA() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-4">
      <p className="text-sm font-semibold text-[var(--color-ink)]">
        You&rsquo;ve used your free preview.
      </p>
      <p className="text-xs text-[var(--color-ink-dim)] mt-1">
        Sign up for unlimited canvases — starts at $0.
      </p>
      <Link
        href="#pricing"
        className="mt-3 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--color-accent-hover)] transition-colors"
      >
        Get started free
      </Link>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-6 h-6 rounded-full border-2 border-white/20 border-t-[var(--color-accent)]"
      style={{ animation: "cb-spin .8s linear infinite" }}
    />
  );
}
