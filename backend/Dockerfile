# Vallavan backend (NestJS) — container image for the shared VPS.
#
# Runs alongside other clients' apps on that box, so it must not assume a free
# port. The process listens on 3001 INSIDE the container (backend/src/main.ts
# reads PORT and defaults to 3001); the host port is chosen at run time:
#
#   docker build -t vallavan-backend ./backend
#   docker run -d --name vallavan-backend --restart unless-stopped \
#     -p 3011:3001 --env-file backend/.env vallavan-backend
#
# 3011 is the host port nginx proxies to (see project/nginx/vallavan.conf).
# 3001 is already taken on that VPS by another client's app, which is exactly
# why the mapping is 3011->3001 rather than 3001->3001.
#
# Secrets are NOT baked in: .dockerignore keeps .env out of the image and it is
# supplied at run time via --env-file. The image is therefore safe to rebuild
# and move around without carrying the service-role key.

# ---------- build ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Prisma's engines are linked against OpenSSL; on Alpine (musl) `prisma
# generate` cannot resolve its binary target without it and warns or fails.
RUN apk add --no-cache openssl

# Copy manifests first so the dependency layer is cached until they change.
# package-lock.json is committed and in sync, which is what makes `npm ci`
# (exact, reproducible install) usable here rather than `npm install`.
COPY package*.json ./
RUN npm ci

COPY . .

# Generates the Prisma client into node_modules. Note that nothing in src/
# imports @prisma/client today — the runtime talks to Supabase via
# SupabaseService, and the schema is currently a typed mirror of the database
# rather than a live query layer. This step and the prisma/ copy below are
# therefore insurance, not a present requirement: they cost one build layer and
# stop the image from breaking confusingly the first time someone does import
# PrismaClient. `generate` does not connect to the database, so it needs no
# DATABASE_URL at build time.
RUN npx prisma generate

RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Present for the same reason as `prisma generate` above — the generated client
# loads its engine relative to the schema.
RUN apk add --no-cache openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Documents the container's own port. It does NOT publish anything — the host
# mapping (-p 3011:3001) does that.
EXPOSE 3001

# Matches package.json's "start" script exactly; nest build emits dist/main.js.
CMD ["node", "dist/main.js"]
