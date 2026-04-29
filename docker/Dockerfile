# ==================== Build Stage ====================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

# Copy only package.json files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/env/package.json ./packages/env/
COPY packages/types/package.json ./packages/types/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

# Build @mine-monopoly/env (only workspace package that needs compilation)
COPY packages/env/ ./packages/env/
RUN pnpm --filter @mine-monopoly/env build

# Copy remaining source code
COPY packages/types/ ./packages/types/
COPY apps/server/ ./apps/server/

# Create standalone deployment with all dependencies properly resolved
# (including transitive deps of workspace packages like dotenv from @mine-monopoly/env)
RUN pnpm --filter @mine-monopoly/server deploy --legacy /app/deploy

# Bundle server with esbuild into a single file
# --packages=external: keep npm dependencies external (loaded from node_modules)
# This preserves CJS/ESM interop for packages like typeorm and dotenv
RUN npm install -g esbuild && \
    npx esbuild /app/deploy/app.ts \
  --bundle --platform=node --format=esm \
  --packages=external \
  --outfile=/app/deploy/server.js

# ==================== Runtime Stage ====================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy deployed node_modules (self-contained, all deps properly resolved)
COPY --from=builder /app/deploy/node_modules ./node_modules

# Copy bundled output
COPY --from=builder /app/deploy/server.js ./server.js

# Copy public files (static assets: avatars, game maps, logs)
COPY --from=builder /app/apps/server/public ./public

EXPOSE 8081 8082

CMD ["node", "server.js"]
