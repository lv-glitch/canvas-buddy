import { ImageResponse } from "next/og";

// Dynamic OG image — Next.js renders this JSX to a 1200×630 PNG at build/
// request time and serves it from /opengraph-image. Used for social shares
// (Twitter/iMessage/Slack/etc.). Tagged in app/layout.tsx via the metadata.
export const alt = "Canvas Buddy — Spotify Canvas videos in seconds.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#121212";
const ACCENT = "#1ED760";
const PURPLE = "#B388FF";
const INK = "#ffffff";
const INK_DIM = "rgba(255,255,255,0.65)";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          color: INK,
          position: "relative",
        }}
      >
        {/* Accent glow in the top-right */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 70%)`,
          }}
        />
        {/* Purple glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -200,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${PURPLE}22 0%, transparent 70%)`,
          }}
        />

        {/* Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {/* Equalizer bars */}
            <div style={{ width: 8, height: 32, background: BG, borderRadius: 2 }} />
            <div style={{ width: 8, height: 22, background: BG, borderRadius: 2, opacity: 0.4 }} />
            <div style={{ width: 8, height: 32, background: BG, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            Canvas Buddy
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: "auto",
            fontSize: 80,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex" }}>Upload your art.</div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <span>Get a&nbsp;</span>
            <span style={{ color: ACCENT }}>Canvas video</span>
            <span>&nbsp;in seconds.</span>
          </div>
        </div>

        {/* Subline */}
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            color: INK_DIM,
            display: "flex",
            gap: 24,
          }}
        >
          <span>1080×1920 · 9:16 · MP4</span>
          <span style={{ color: ACCENT }}>·</span>
          <span>Spotify Canvas spec, baked in.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
