# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npx prisma generate && npm run build && \
    node -e "const fs=require('fs');const raw=fs.readFileSync('src/data/agents.ts','utf-8');const m=raw.match(/export const AGENTS[^=]*=\s*(\[[\s\S]*\])\s*\$/);fs.writeFileSync('scripts/agents.json',m[1])"

# ---- 运行阶段 ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY public ./public

EXPOSE 3000
CMD ["sh", "-c", "node node_modules/.bin/prisma migrate deploy && node scripts/seed-agents.mjs && node server.js"]
