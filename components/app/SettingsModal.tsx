"use client";

import { useEffect, useRef, useState } from "react";

const TOOL_API =
  process.env.NEXT_PUBLIC_TOOL_API || "http://localhost:3737";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface SettingsState {
  hasApiKey: boolean;
  keyPreview: string | null;
  model: string;
}

const FLUX_MODELS = [
  { value: "fal-ai/flux/schnell",   label: "Schnell — fastest (~$0.003)" },
  { value: "fal-ai/flux/dev",        label: "Dev — balanced (~$0.025)" },
  { value: "fal-ai/flux-pro/v1.1",  label: "Pro 1.1 — best quality (~$0.04)" },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<SettingsState | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [model, setModel] = useState("fal-ai/flux-pro/v1.1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync the dialog with the open prop, fetch fresh settings each time
  // it's opened so the "Currently saved" preview is always accurate.
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      setKeyInput("");
      setError(null);
      void refresh();
    }
    if (!open && dlg.open) dlg.close();
  }, [open]);

  async function refresh() {
    try {
      const r = await fetch(`${TOOL_API}/api/settings`);
      const s = await r.json();
      setState(s);
      if (s.model) setModel(s.model);
    } catch {
      setState(null);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = { falModel: model };
      if (keyInput.trim()) body.falApiKey = keyInput.trim();
      const r = await fetch(`${TOOL_API}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-0 w-[460px] max-w-[92vw] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h3 className="text-lg font-bold tracking-tight">Settings</h3>
        <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
          Your fal.ai API key is stored locally and only sent to fal.ai for
          Flux image generation. Get one at{" "}
          <a
            href="https://fal.ai/dashboard/keys"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            fal.ai/dashboard/keys
          </a>
          .
        </p>

        <label className="block mt-5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          fal.ai API Key
        </label>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={state?.hasApiKey ? state.keyPreview ?? "•••" : "key_..."}
          autoComplete="off"
          className="mt-2 w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-purple)]"
        />
        <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
          {state?.hasApiKey
            ? `Saved: ${state.keyPreview}. Leave blank to keep, paste a new key to replace.`
            : "No key saved yet."}
        </p>

        <label className="block mt-5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          Default Flux model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="mt-2 w-full rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-purple)]"
        >
          {FLUX_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-3 text-xs text-[#ff6b6b]">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-[var(--radius-pill)] text-sm font-semibold border border-[var(--color-border)] hover:border-[var(--color-ink-dim)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-[var(--radius-pill)] text-sm font-semibold bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
