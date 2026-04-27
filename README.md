# Canvas Buddy

Marketing site + the actual app at `/app`. Generates Spotify Canvas videos
(9:16 vertical MP4s) from photos or AI prompts.

The FFmpeg + Flux backend lives in a sibling repo (`canvas-maker`) and gets
deployed to Fly.io. This frontend deploys to Vercel.

## Local dev

```bash
# 1. Backend (separate terminal)
cd ../canvas-maker
npm run web                      # listens on :3737

# 2. Frontend
npm install
npm run dev                      # serves on :3000 by default; this repo uses :3030
```

Visit:
- `http://localhost:3030/` — landing page
- `http://localhost:3030/app` — the actual canvas tool

## Env vars

Copy `.env.example` to `.env.local` and edit:

```
NEXT_PUBLIC_TOOL_API=http://localhost:3737     # local backend
# NEXT_PUBLIC_TOOL_API=https://canvas-buddy-api.fly.dev   # production
```

## Deploy

See `DEPLOY.md` for the Fly.io + Vercel setup.

## Project layout

- `app/page.tsx` — landing
- `app/app/page.tsx` — the canvas app (3-panel layout: source + AI prompt left,
  preview center, library right)
- `components/` — landing components (Hero, Pricing, Examples, etc.)
- `components/app/` — app components (TopNav, LeftPanel, CenterPanel, RightPanel,
  SettingsModal, DownloadModal)
- `public/examples/` — Drop MP4s here, they auto-appear in the Examples section.
