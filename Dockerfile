# syntax=docker/dockerfile:1.7

# ─── Stage 1: builder ─────────────────────────────────────────────────────────
# Installs dev deps, builds the frontend (vite) + backend (esbuild bundle),
# generates the Prisma client. Output is a tiny dist/ tree.
FROM node:22-alpine AS builder
WORKDIR /app

# Install ALL deps (dev + prod) so the build can use tsx/vite/prisma/esbuild
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy the rest of the source
COPY prisma ./prisma
COPY backend ./backend
COPY frontend ./frontend
COPY tsconfig*.json ./

# Build: prisma client + frontend SPA + bundled backend
RUN npm run build

# ─── Stage 2: runtime ─────────────────────────────────────────────────────────
# Slim image with only what `node dist/server.cjs` needs at runtime.
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Production dependencies only (Prisma runtime + Express + everything bundled
# expects @prisma/client at runtime even though esbuild marked it external).
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Generated Prisma client + the built bundle + frontend assets + prisma schema
# (schema is needed at runtime for `prisma migrate deploy` invoked by the
# entrypoint script before the server starts).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/prisma ./prisma

# Cloud Run health-check + listener port
EXPOSE 8080

# Entrypoint: run pending migrations, then start the server.
# - `prisma migrate deploy` is safe to run on every cold-start; it's a no-op
#   when migrations are up to date.
# - If the DB is unreachable we fail loud (don't start the server with a
#   half-applied schema).
CMD ["sh","-c","npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.mjs"]
