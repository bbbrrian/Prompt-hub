import { PrismaClient } from '@prisma/client'
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 优先读预生成的 JSON，fallback 到 .ts 源文件（本地开发用）
const jsonPath = path.join(__dirname, 'agents.json')
const tsPath = path.join(__dirname, '../src/data/agents.ts')
let AGENTS
try {
  AGENTS = JSON.parse(readFileSync(jsonPath, 'utf-8'))
} catch {
  const raw = readFileSync(tsPath, 'utf-8')
  const agentsMatch = raw.match(/export const AGENTS[^=]*=\s*(\[[\s\S]*\])\s*$/)
  if (!agentsMatch) { console.error('无法解析 AGENTS'); process.exit(1) }
  AGENTS = JSON.parse(agentsMatch[1])
}

const prisma = new PrismaClient()

async function main() {
  console.log(`开始导入 ${AGENTS.length} 个 Agent...`)

  // 先创建所有 divisionZh 标签
  const divisionNames = [...new Set(AGENTS.map(a => a.divisionZh))]
  for (const name of divisionNames) {
    await prisma.tag.upsert({ where: { name }, create: { name }, update: {} })
  }
  console.log(`已创建/确认 ${divisionNames.length} 个分类标签`)

  let created = 0, skipped = 0
  for (const agent of AGENTS) {
    const name = `${agent.emoji} ${agent.nameZh}`
    const existing = await prisma.agent.findFirst({ where: { name, isDeleted: false } })
    if (existing) { skipped++; continue }

    const tag = await prisma.tag.findUnique({ where: { name: agent.divisionZh } })
    await prisma.agent.create({
      data: {
        name,
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        author: agent.name,
        tags: tag ? { create: [{ tagId: tag.id }] } : undefined,
      },
    })
    created++
  }

  console.log(`完成：新增 ${created} 个，跳过 ${skipped} 个`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
