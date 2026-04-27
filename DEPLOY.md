# Deploying Canvas Buddy

Two deploys, in this order:

1. **Backend** — `canvas-maker` to Fly.io (~10 min)
2. **Frontend** — this repo to Vercel (~5 min)

Total fresh-account time: ~15 minutes once both accounts exist.

---

## 1. Backend → Fly.io

### a. Sign up & install CLI

1. Sign up at https://fly.io/app/sign-up (free tier; ~$5/mo when actively running, $0 when idle thanks to auto-stop).
2. Install `flyctl`:
   ```bash
   curl -L https://fly.io/install.sh | sh
   # Add to PATH if not already:
   export FLYCTL_INSTALL="$HOME/.fly"
   export PATH="$FLYCTL_INSTALL/bin:$PATH"
   ```
3. Log in:
   ```bash
   fly auth login
   ```

### b. Launch the app

```bash
cd ~/canvas-maker
fly launch --copy-config --no-deploy
```

When prompted:
- App name: accept the default `canvas-buddy-api` (or pick one — must be globally unique).
- Region: pick the closest. `sjc` (San Jose) is good for the US west coast.
- Postgres / Redis / Tigris: **No** to all.

This creates the Fly app and Docker registry without deploying yet.

### c. Set the fal.ai key as a secret

```bash
fly secrets set FAL_API_KEY=<your-key>
fly secrets set ALLOWED_ORIGINS="https://canvas-buddy-landing.vercel.app,https://canvasbuddy.com"
# Add more origins comma-separated as you stand up custom domains.
```

### d. Deploy

```bash
fly deploy
```

First build pulls the Node + FFmpeg layers (~2 min). After that, redeploys are
~30 seconds. When complete, fly prints something like:

```
Visit your newly deployed app at https://canvas-buddy-api.fly.dev
```

### e. Smoke test

```bash
curl https://canvas-buddy-api.fly.dev/api/options | head -c 200
# Should return JSON with animations + filters.
```

---

## 2. Frontend → Vercel

### a. Push this repo to GitHub

```bash
cd ~/canvas-buddy-landing
git remote add origin git@github.com:lv-glitch/canvas-buddy.git
git push -u origin main
```

(If the repo doesn't exist yet on GitHub, create it via the web UI — empty,
no README, public or private both work.)

### b. Import to Vercel

1. Go to https://vercel.com/new
2. Sign in with GitHub.
3. Import the `canvas-buddy` repo.
4. Framework preset: Next.js (auto-detected).
5. **Environment variables** — add this one:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_TOOL_API` | `https://canvas-buddy-api.fly.dev` (the URL from step 1d) |

6. Click **Deploy**. ~2 min.

### c. Smoke test

Visit `https://<your-project>.vercel.app/app` — drop a photo and hit Generate
Canvas. If the MP4 plays in the preview, end-to-end is working.

If you see a CORS error in the browser console, add the Vercel domain to the
backend's `ALLOWED_ORIGINS` secret:

```bash
cd ~/canvas-maker
fly secrets set ALLOWED_ORIGINS="https://canvas-buddy-landing.vercel.app,https://canvas-buddy-landing-<hash>.vercel.app"
```

(Vercel preview deployments get a unique hash subdomain; add wildcards or
specific previews as needed.)

---

## Subsequent releases

**Backend changes** (any edit in `~/canvas-maker/src/`):

```bash
cd ~/canvas-maker
fly deploy
```

**Frontend changes** (any edit in `~/canvas-buddy-landing/`):

```bash
cd ~/canvas-buddy-landing
git push
# Vercel auto-deploys on push to main.
```

## Troubleshooting

### Fly: cold start is slow on first request after idle
Expected. `auto_stop_machines = "stop"` saves money but the first hit after
idle wakes the machine (~2-3s). Bump `min_machines_running = 1` in `fly.toml`
to keep one warm — costs about $5/mo extra.

### Vercel build fails with type errors
Run `npm run build` locally first; types must compile.

### "fal.ai API key not configured" in production
You forgot `fly secrets set FAL_API_KEY=...`. Set it, then `fly deploy` again
(or `fly machine restart` to pick up the secret without rebuilding).
