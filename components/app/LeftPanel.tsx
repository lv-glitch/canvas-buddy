"use client";

import { useRef } from "react";
import { Turnstile } from "@/components/Turnstile";

export interface OptionItem {
  value: string;
  label: string;
}

interface LeftPanelProps {
  effects: OptionItem[];
  filters: OptionItem[];

  sourceMode: "upload" | "ai";
  setSourceMode: (m: "upload" | "ai") => void;

  sourceURL: string | null;
  onPickFile: (file: File) => void;
  onClearImage: () => void;

  aiPrompt: string;
  setAIPrompt: (s: string) => void;
  aiGenerationsLeft: number;
  onAIGenerate: () => void;
  onTurnstileToken: (token: string) => void;
  /** Latest Turnstile token. Empty until Cloudflare's invisible bot
   *  check finishes — Generate button stays disabled while empty so we
   *  can never POST without a token. */
  turnstileToken: string;
  aiBusy: boolean;
  aiError: string | null;

  effect: string;
  setEffect: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;

  duration: number;
  setDuration: (n: number) => void;
}

export function LeftPanel(props: LeftPanelProps) {
  return (
    <aside className="w-[380px] flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] overflow-y-auto">
      <div className="p-5 space-y-6">
        <SourceSection {...props} />
        <Section title="Effect">
          <Grid2
            items={props.effects}
            selected={props.effect}
            onPick={props.setEffect}
            tone="green"
          />
        </Section>
        <Section title="Filter">
          <Grid2
            items={props.filters}
            selected={props.filter}
            onPick={props.setFilter}
            tone="purple"
          />
        </Section>
        <Section title="Duration">
          <DurationSlider
            value={props.duration}
            onChange={props.setDuration}
          />
        </Section>
      </div>
    </aside>
  );
}

/* ---------- Source section: upload / AI tabs ---------- */

function SourceSection(props: LeftPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Section title="Source image">
      <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] mb-3">
        <TabBtn
          active={props.sourceMode === "upload"}
          onClick={() => props.setSourceMode("upload")}
        >
          Upload
        </TabBtn>
        <TabBtn
          active={props.sourceMode === "ai"}
          onClick={() => props.setSourceMode("ai")}
        >
          AI Generate
        </TabBtn>
      </div>

      {props.sourceMode === "upload" ? (
        <div
          className="rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 hover:border-[var(--color-accent)] transition-colors cursor-pointer p-4"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f && f.type.startsWith("image/")) props.onPickFile(f);
          }}
        >
          {props.sourceURL ? (
            <div className="relative">
              <img
                src={props.sourceURL}
                alt="Source"
                className="w-full aspect-[9/16] object-cover rounded-md"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onClearImage();
                }}
                className="absolute top-2 right-2 px-2 py-1 rounded text-[11px] bg-black/70 text-white hover:bg-black/90"
              >
                Replace
              </button>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-11 h-11 rounded-full bg-[var(--color-accent)]/15 mx-auto flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-accent)]">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-medium">Drop an image</p>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">
                JPG, PNG, WebP
              </p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) props.onPickFile(f);
            }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={props.aiPrompt}
            onChange={(e) => props.setAIPrompt(e.target.value)}
            placeholder="Describe the image you want…"
            rows={4}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-purple)] transition-colors"
          />
          <button
            type="button"
            onClick={props.onAIGenerate}
            disabled={
              !props.aiPrompt.trim() ||
              props.aiBusy ||
              props.aiGenerationsLeft <= 0 ||
              !props.turnstileToken
            }
            title={!props.turnstileToken ? "Verifying you're not a bot…" : undefined}
            className="w-full inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-purple)] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[var(--color-purple-hover)] transition-colors disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)] disabled:cursor-not-allowed"
          >
            {props.aiBusy
              ? "Generating…"
              : !props.turnstileToken
              ? "Verifying…"
              : "✨ Generate"}
          </button>
          {/* Invisible bot check — only renders interaction UI for suspect
              traffic. Token sets on mount; refreshes itself on expiry. */}
          <Turnstile onToken={props.onTurnstileToken} className="mt-1" />
          {props.aiError ? (
            <p className="text-[11px] text-[#ff6b6b] leading-snug">
              {props.aiError}
            </p>
          ) : (
            <p className="text-[11px] text-[var(--color-ink-muted)] text-center">
              {props.aiGenerationsLeft} AI generation
              {props.aiGenerationsLeft === 1 ? "" : "s"} left · Flux Pro 1.1
            </p>
          )}
        </div>
      )}
    </Section>
  );
}

/* ---------- Generic 2-col grid of selectable buttons ---------- */

function Grid2({
  items,
  selected,
  onPick,
  tone,
}: {
  items: OptionItem[];
  selected: string;
  onPick: (v: string) => void;
  tone: "green" | "purple";
}) {
  // Function name kept for diff-friendliness; actually a 3-col grid now.
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const active = item.value === selected;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onPick(item.value)}
            className={[
              "px-2.5 py-2 rounded-md text-[12px] font-medium border transition-colors text-center",
              active && tone === "green"
                ? "bg-[var(--color-accent)] text-black border-[var(--color-accent)]"
                : "",
              active && tone === "purple"
                ? "bg-[var(--color-purple)] text-black border-[var(--color-purple)]"
                : "",
              !active
                ? "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]"
                : "",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Duration slider ---------- */

function DurationSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-[var(--color-ink-dim)] mb-2">
        <span>3s</span>
        <span className="text-sm font-semibold text-[var(--color-ink)] tabular-nums">
          {value.toFixed(1)}s
        </span>
        <span>8s</span>
      </div>
      <input
        type="range"
        min={3}
        max={8}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  );
}

/* ---------- Helpers ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded text-xs font-semibold transition-colors",
        active
          ? "bg-[var(--color-bg)] text-[var(--color-ink)]"
          : "text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
