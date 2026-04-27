# Canvas Buddy frontend — Next.js 16 standalone build, runs on Fly.io.
# Multi-stage to keep the runtime image small (~150MB).

# ---------- 1. Install deps ----------
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2. Build ----------
FROM node:20-slim AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars must be present at build time — Next.js inlines them
# into the client bundle. Provided by fly.toml [build.args] (or `fly deploy
# --build-arg`).
ARG NEXT_PUBLIC_TOOL_API
ENV NEXT_PUBLIC_TOOL_API=$NEXT_PUBLIC_TOOL_API

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 3. Run ----------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3030
ENV HOSTNAME=0.0.0.0

# Standalone output ships its own minimal server.js + a copy of node_modules
# trimmed to what the build actually uses. `public/` and `.next/static/` are
# served separately so they're copied alongside.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3030
CMD ["node", "server.js"]
