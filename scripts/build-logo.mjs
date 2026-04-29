// One-off: render a 512x128 transparent PNG of the brand wordmark for
// uploading to Stripe Checkout / OG metadata / favicons / etc. Pulls
// shape values from components/Logo.tsx so the icon matches the live one.
//
// Run from the canvas-buddy-landing root:
//   node scripts/build-logo.mjs
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const W = 512;
const H = 128;

// 96px circle (matches the in-app TopNav logo proportions). Centered
// vertically, padded 16px from the left.
const ICON_SIZE = 96;
const ICON_X = 16;
const ICON_Y = (H - ICON_SIZE) / 2;

// Equalizer-bar geometry from components/Logo.tsx (viewBox=40), scaled
// to ICON_SIZE.
const sc = ICON_SIZE / 40;
const cx = ICON_X + ICON_SIZE / 2;
const cy = H / 2;
const r = ICON_SIZE / 2;

// Three bars: short / tall / medium. Position relative to viewBox 40 then scale.
const bars = [
  { vx: 12.5, vy: 14.5, vw: 3.5, vh: 11 },
  { vx: 18.25, vy: 10, vw: 3.5, vh: 20 },
  { vx: 24, vy: 16.5, vw: 3.5, vh: 7 },
].map((b) => ({
  x: ICON_X + b.vx * sc,
  y: ICON_Y + b.vy * sc,
  w: b.vw * sc,
  h: b.vh * sc,
  rx: 1 * sc,
}));

// Text — "Canvas Buddy" in Inter 500. We don't have Inter bundled, so we
// use a system-sans stack and let sharp pick the rendering font from the
// host's font cache.
const TEXT_X = ICON_X + ICON_SIZE + 24;
const TEXT_Y = H / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1ED760"/>
  ${bars.map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.rx}" fill="#121212"/>`).join("\n  ")}
  <text x="${TEXT_X}" y="${TEXT_Y}"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="48"
        font-weight="500"
        fill="#FFFFFF"
        dominant-baseline="middle"
        letter-spacing="-1">Canvas Buddy</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
const out = join(homedir(), "Desktop", "canvas-buddy-logo.png");
await writeFile(out, png);
console.log(`Wrote ${out} (${png.length} bytes, ${W}x${H})`);
