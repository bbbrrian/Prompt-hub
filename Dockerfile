# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npx prisma generate && npm run build

# ---- 运行阶段 ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY scripts ./scripts
COPY src/data ./src/data
COPY public ./public
COPY next.config.js ./

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/seed-agents.mjs && npm start"]
