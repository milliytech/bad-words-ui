# 1. Build bosqichi
FROM node:22-alpine AS builder

WORKDIR /app

# pnpm uchun corepack yoqamiz
RUN corepack enable

# package fayllarni ko‘chiramiz
COPY package.json pnpm-lock.yaml* ./

# dependency o‘rnatamiz (lockfile bo‘yicha)
RUN pnpm install --no-frozen-lockfile

# source code ko‘chiramiz
COPY . .

# Next.js build
RUN pnpm build

# 2. Production bosqichi
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

# kerakli fayllarni ko‘chiramiz
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3009

CMD ["pnpm", "start"]
