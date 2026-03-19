import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import JSZip from 'jszip'

async function resolveTagIds(tagNames: string[]) {
  const result = []
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({ where: { name }, create: { name }, update: {} })
    result.push({ tagId: tag.id })
  }
  return result
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '未上传文件' }, { status: 400 })

  const filename = file.name.toLowerCase()

  if (filename.endsWith('.md')) {
    const text = await file.text()
    const { tags, ...parsed } = parseSkillMd(text)
    const skill = await prisma.skill.create({
      data: {
        ...parsed,
        userId: payload.userId,
        tags: tags.length ? { create: await resolveTagIds(tags) } : undefined,
      },
    })
    return NextResponse.json(skill, { status: 201 })
  }

  if (filename.endsWith('.zip')) {
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)

    let skillMdContent = ''
    const references: any[] = []
    const scripts: any[] = []

    for (const [filePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue
      const parts = filePath.split('/')
      const name = parts[parts.length - 1]
      const parent = parts.length > 1 ? parts[parts.length - 2] : ''

      if (name === 'SKILL.md') {
        skillMdContent = await zipEntry.async('string')
      } else if (parent === 'references') {
        references.push({ filename: name, content: await zipEntry.async('string') })
      } else if (parent === 'scripts') {
        const ext = name.split('.').pop() || 'sh'
        const langMap: Record<string, string> = { sh: 'sh', py: 'py', js: 'js', ts: 'ts' }
        scripts.push({ filename: name, language: langMap[ext] || 'sh', content: await zipEntry.async('string') })
      }
    }

    if (!skillMdContent) {
      return NextResponse.json({ error: 'ZIP 中未找到 SKILL.md' }, { status: 400 })
    }

    const { tags, ...parsed } = parseSkillMd(skillMdContent)
    const skill = await prisma.skill.create({
      data: {
        ...parsed,
        references: references.length > 0 ? references : undefined,
        scripts: scripts.length > 0 ? scripts : undefined,
        userId: payload.userId,
        tags: tags.length ? { create: await resolveTagIds(tags) } : undefined,
      },
    })
    return NextResponse.json(skill, { status: 201 })
  }

  return NextResponse.json({ error: '仅支持 .md 或 .zip 文件' }, { status: 400 })
}

function parseSkillMd(text: string) {
  let name = 'imported-skill'
  let description = ''
  let author = ''
  let tags: string[] = []
  let content = text

  const fmMatch = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (fmMatch) {
    const frontmatter = fmMatch[1]
    content = fmMatch[2].trim()
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
    const descMatch = frontmatter.match(/^description:\s*([\s\S]+?)(?=\n\w|\n$|$)/m)
    const authorMatch = frontmatter.match(/^author:\s*(.+)$/m)
    const tagsMatch = frontmatter.match(/^tags:\s*(.+)$/m)
    if (nameMatch) name = nameMatch[1].trim()
    if (descMatch) description = descMatch[1].trim().replace(/\n\s+/g, ' ')
    if (authorMatch) author = authorMatch[1].trim()
    if (tagsMatch) tags = tagsMatch[1].split(',').map((t: string) => t.trim()).filter(Boolean)
  }

  return { name, description, content, ...(author ? { author } : {}), tags }
}
