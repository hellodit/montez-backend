# syntax=docker/dockerfile:1

FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies in their own layer so `bun install` only reruns
# when package.json / bun.lock actually change.
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Runtime image: reuse the resolved node_modules, then bring in source.
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["bun", "run", "src/app.ts"]
