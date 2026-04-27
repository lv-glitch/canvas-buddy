"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/app/TopNav";
import { LeftPanel, type OptionItem } from "@/components/app/LeftPanel";
import { CenterPanel } from "@/components/app/CenterPanel";
import { RightPanel, type SavedCanvas } from "@/components/app/RightPanel";
import { DownloadModal } from "@/components/app/DownloadModal";
import { SettingsModal } from "@/components/app/SettingsModal";

// Mirror the actual tool's animations and filters so what you pick here maps
// 1:1 to what FFmpeg renders on the backend.
const EFFECTS: OptionItem[] = [
  { value: "zoom",     label: "Zoom" },
  { value: "drift",    label: "Drift" },
  { value: "pulse",    label: "Pulse" },
  { value: "kenburns", label: "Ken Burns" },
  { value: "tilt",     label: "Tilt" },
  { value: "vertigo",  label: "Vertigo" },
  { value: "glow",     label: "Glow" },
  { value: "rotate",   label: "Rotate" },
];

const FILTERS: OptionItem[] = [
  { value: "none",       label: "None" },
  { value: "goldenhour", label: "Golden Hour" },
  { value: "sunkissed",  label: "Sunkissed" },
  { value: "coast",      label: "Coast" },
  { value: "softwash",   label: "Soft Wash" },
  { value: "parisian",   label: "Parisian" },
  { value: "analog",     label: "Analog" },
  { value: "noir",       label: "Noir" },
  { value: "retro",      label: "Retro" },
  { value: "vhs",        label: "VHS" },
  { value: "softfocus",  label: "Soft Focus" },
  { value: "glitch",     label: "Glitch" },
  { value: "shimmer",    label: "Shimmer" },
];

type Plan = "free" | "percanvas" | "pro";

// Where the FFmpeg + Flux backend lives. Override with NEXT_PUBLIC_TOOL_API
// for staging/prod; defaults to the local canvas-maker on port 3737.
const TOOL_API =
  process.env.NEXT_PUBLIC_TOOL_API || "http://localhost:3737";

export default function CanvasBuddyApp() {
  // Plan + quota — hardcoded for now. Real billing wires in later.
  const [plan] = useState<Plan>("free");
  const [aiGenerationsLeft, setAIGenerationsLeft] = useState<number>(5);
  const VIDEOS_LIMIT = 5;

  // Source image — keep both the File (needed for multipart upload to the
  // backend) and a blob URL (for the live preview img tag).
  const [sourceMode, setSourceMode] = useState<"upload" | "ai">("upload");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceURL, setSourceURL] = useState<string | null>(null);
  const [aiPrompt, setAIPrompt] = useState<string>("");
  const [aiBusy, setAIBusy] = useState<boolean>(false);
  const [aiError, setAIError] = useState<string | null>(null);

  // Effect / filter / duration
  const [effect, setEffect] = useState<string>("zoom");
  const [filter, setFilter] = useState<string>("none");
  const [duration, setDuration] = useState<number>(6);

  // Render state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [resultURL, setResultURL] = useState<string | null>(null);
  const [canvases, setCanvases] = useState<SavedCanvas[]>([]);

  // Modals
  const [downloadModalFor, setDownloadModalFor] = useState<SavedCanvas | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Cleanup all object URLs on unmount.
  useEffect(() => {
    return () => {
      if (sourceURL) URL.revokeObjectURL(sourceURL);
      for (const c of canvases) URL.revokeObjectURL(c.thumbnailURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickFile(file: File) {
    if (sourceURL) URL.revokeObjectURL(sourceURL);
    setSourceFile(file);
    setSourceURL(URL.createObjectURL(file));
    setResultURL(null);
    setRenderError(null);
  }

  function clearImage() {
    if (sourceURL) URL.revokeObjectURL(sourceURL);
    setSourceFile(null);
    setSourceURL(null);
    setResultURL(null);
    setRenderError(null);
  }

  // Real AI image generation via the canvas-maker backend (Flux Pro 1.1
  // through fal.ai). Returns a 1080×1920 PNG which becomes the source image.
  async function aiGenerate() {
    if (aiBusy || !aiPrompt.trim() || aiGenerationsLeft <= 0) return;
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
      pickFile(new File([blob], "ai.png", { type: "image/png" }));
      setAIGenerationsLeft((n) => Math.max(0, n - 1));
    } catch (e) {
      setAIError(e instanceof Error ? e.message : String(e));
    } finally {
      setAIBusy(false);
    }
  }

  // Real canvas generation — uploads source to /api/generate, gets MP4 back.
  async function generate() {
    if (!sourceFile || isGenerating) return;
    if (canvases.length >= VIDEOS_LIMIT && plan === "free") return;

    setIsGenerating(true);
    setRenderError(null);
    try {
      const fd = new FormData();
      fd.append("image", sourceFile);
      fd.append("animation", effect);
      fd.append("filter", filter);
      fd.append("layout", "fill");
      fd.append("duration", String(duration));
      const r = await fetch(`${TOOL_API}/api/generate`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Render failed (HTTP ${r.status})`);
      }
      const blob = await r.blob();
      const videoURL = URL.createObjectURL(blob);
      const next: SavedCanvas = {
        id: String(Date.now()),
        name: `Canvas ${canvases.length + 1}`,
        effect: labelFor(EFFECTS, effect),
        filter: labelFor(FILTERS, filter),
        duration,
        thumbnailURL: sourceURL!, // still image works as a thumbnail
        videoURL,
      };
      setCanvases((cs) => [next, ...cs]);
      setResultURL(videoURL);
    } catch (e) {
      setRenderError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsGenerating(false);
    }
  }

  function reset() {
    clearImage();
    setAIPrompt("");
    setEffect("zoom");
    setFilter("none");
    setDuration(6);
  }

  function downloadCurrent() {
    if (!resultURL) return;
    if (plan === "pro" || plan === "percanvas") {
      triggerDownload(resultURL, "canvas.mp4");
    } else {
      // Free: choose between watermarked free vs. $4.99 clean
      const last = canvases[0];
      if (last) setDownloadModalFor(last);
    }
  }

  function downloadFromList(c: SavedCanvas) {
    if (plan === "pro" || plan === "percanvas") {
      triggerDownload(c.videoURL, `${c.name}.mp4`);
    } else {
      setDownloadModalFor(c);
    }
  }

  function deleteCanvas(id: string) {
    setCanvases((cs) => {
      const target = cs.find((c) => c.id === id);
      // The thumbnail and video URLs are blob URLs created via
      // createObjectURL; revoke to release memory. (In the stub, both point
      // at the same blob as the source image; once we have a real backend
      // they'll be distinct URLs that need explicit cleanup.)
      if (target && target.thumbnailURL && target.thumbnailURL !== sourceURL) {
        URL.revokeObjectURL(target.thumbnailURL);
      }
      if (
        target &&
        target.videoURL &&
        target.videoURL !== target.thumbnailURL &&
        target.videoURL !== sourceURL
      ) {
        URL.revokeObjectURL(target.videoURL);
      }
      return cs.filter((c) => c.id !== id);
    });
    // If the canvas we just deleted was the one displayed in the center
    // preview, clear that view too.
    setDownloadModalFor((cur) => (cur && cur.id === id ? null : cur));
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <TopNav
        videosUsed={canvases.length}
        videosLimit={VIDEOS_LIMIT}
        plan={plan}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftPanel
          effects={EFFECTS}
          filters={FILTERS}
          sourceMode={sourceMode}
          setSourceMode={setSourceMode}
          sourceURL={sourceURL}
          onPickFile={pickFile}
          onClearImage={clearImage}
          aiPrompt={aiPrompt}
          setAIPrompt={setAIPrompt}
          aiGenerationsLeft={aiGenerationsLeft}
          onAIGenerate={aiGenerate}
          aiBusy={aiBusy}
          aiError={aiError}
          effect={effect}
          setEffect={setEffect}
          filter={filter}
          setFilter={setFilter}
          duration={duration}
          setDuration={setDuration}
        />

        <CenterPanel
          sourceURL={sourceURL}
          effect={effect}
          filter={filter}
          duration={duration}
          isGenerating={isGenerating}
          onGenerate={generate}
          onReset={reset}
          onDownload={downloadCurrent}
          resultURL={resultURL}
          effectLabel={labelFor(EFFECTS, effect)}
          filterLabel={labelFor(FILTERS, filter)}
          renderError={renderError}
        />

        <RightPanel
          canvases={canvases}
          plan={plan}
          onDownload={downloadFromList}
          onDelete={deleteCanvas}
        />
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <DownloadModal
        open={!!downloadModalFor}
        onClose={() => setDownloadModalFor(null)}
        onDownloadFree={() => {
          if (downloadModalFor) {
            triggerDownload(
              downloadModalFor.videoURL,
              `${downloadModalFor.name}.mp4`
            );
          }
          setDownloadModalFor(null);
        }}
        onUpgrade={() => {
          // Stub: a real flow would launch Stripe Checkout for the $4.99 product
          alert("Stub: would launch Stripe Checkout for $4.99 watermark-free download.");
          setDownloadModalFor(null);
        }}
      />
    </div>
  );
}

/* ---------- helpers ---------- */

function labelFor(items: OptionItem[], value: string): string {
  return items.find((i) => i.value === value)?.label ?? value;
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

