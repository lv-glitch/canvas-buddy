"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  onDownloadFree: () => void;
  onUpgrade: () => void;
}

/** Free-user download chooser: watermarked free vs. clean for $4.99. */
export function DownloadModal({
  open,
  onClose,
  onDownloadFree,
  onUpgrade,
}: DownloadModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // click-outside to dismiss
        if (e.target === ref.current) onClose();
      }}
      className="bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-0 w-[420px] max-w-[92vw] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h3 className="text-lg font-bold tracking-tight">Download canvas</h3>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Pick how you want to export.
        </p>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onDownloadFree}
            className="w-full text-left rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-ink-muted)] transition-colors p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                Download with watermark
              </span>
              <span className="text-xs text-[var(--color-ink-dim)]">Free</span>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              Includes the small Canvas Buddy mark in the corner.
            </p>
          </button>

          <button
            type="button"
            onClick={onUpgrade}
            className="w-full text-left rounded-md bg-[var(--color-purple)]/10 border-2 border-[var(--color-purple)]/30 hover:border-[var(--color-purple)] transition-colors p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                Remove watermark
              </span>
              <span className="text-xs font-semibold text-[var(--color-purple)]">
                $4.99
              </span>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              One-time purchase for this canvas. No subscription.
            </p>
          </button>
        </div>

        <div className="mt-5 pt-5 border-t border-[var(--color-border)] text-center">
          <p className="text-xs text-[var(--color-ink-dim)]">
            Need 3+ watermark-free videos a month?{" "}
            <Link
              href="/#pricing"
              className="text-[var(--color-accent)] hover:underline"
            >
              Pro is $9.99/mo
            </Link>{" "}
            and saves you money.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </dialog>
  );
}
