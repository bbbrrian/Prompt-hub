# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl && \
    npm config set registry https://registry.npmmirror.com

COPY package*.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npx prisma generate && npm run build && \
    node -e "const fs=require('fs');const raw=fs.readFileSync('src/data/agents.ts','utf-8');const m=raw.match(/export const AGENTS[^=]*=\s*(\[[\s\S]*\])\s*\$/);fs.writeFileSync('scripts/agents.json',m[1])" && \
    node -e "const{transpileModule}=require('typescript');const ts=require('fs').readFileSync('prisma/seed.ts','utf8');const{outputText}=transpileModule(ts,{compilerOptions:{module:1,target:99,esModuleInterop:true}});require('fs').writeFileSync('scripts/seed.cjs',outputText)"

# ---- 运行阶段 ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl && \
    addgroup --system nodejs && adduser --system --ingroup nodejs nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY public ./public

COPY <<'ENTRY' /app/entrypoint.sh
#!/bin/sh
node node_modules/prisma/build/index.js migrate deploy
if [ ! -f /app/.seeded ]; then
  node scripts/seed.cjs && node scripts/seed-agents.mjs && touch /app/.seeded
fi
exec node server.js
ENTRY
RUN chmod +x /app/entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
