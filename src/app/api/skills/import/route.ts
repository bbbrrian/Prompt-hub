import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'
import { verifyTokenWithUser } from '@/lib/auth-server'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'

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
  const payload = token ? await verifyTokenWithUser(token) : null
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
    const assets: any[] = []
    const assetFiles: { filename: string; buffer: Buffer }[] = []

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
      } else if (parent === 'assets') {
        const buf = Buffer.from(await zipEntry.async('arraybuffer'))
        assetFiles.push({ filename: name, buffer: buf })
      }
    }

    if (!skillMdContent) {
      return NextResponse.json({ error: 'ZIP 中未找到 SKILL.md' }, { status: 400 })
    }

    const { tags, ...parsed } = parseSkillMd(skillMdContent)

    if (assetFiles.length > 0) {
      const safeName = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || 'imported-skill'
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'skills', safeName)
      fs.mkdirSync(uploadDir, { recursive: true })
      for (const af of assetFiles) {
        const safeFile = path.basename(af.filename).replace(/[^a-zA-Z0-9._-]/g, '')
        if (!safeFile) continue
        fs.writeFileSync(path.join(uploadDir, safeFile), af.buffer)
        assets.push({ filename: safeFile, storedPath: `/uploads/skills/${safeName}/${safeFile}` })
      }
    }

    const skill = await prisma.skill.create({
      data: {
        ...parsed,
        references: references.length > 0 ? references : undefined,
        scripts: scripts.length > 0 ? scripts : undefined,
        assets: assets.length > 0 ? assets : undefined,
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
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
    const authorMatch = frontmatter.match(/^author:\s*(.+)$/m)
    const tagsMatch = frontmatter.match(/^tags:\s*(.+)$/m)
    if (nameMatch) name = nameMatch[1].trim()
    if (descMatch) description = descMatch[1].trim().replace(/\n\s+/g, ' ')
    if (authorMatch) author = authorMatch[1].trim()
    if (tagsMatch) tags = tagsMatch[1].split(',').map((t: string) => t.trim()).filter(Boolean)
  }

  return { name, description, content, ...(author ? { author } : {}), tags }
}
