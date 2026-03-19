import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function toSkillName(title: string) {
  return title
    .toLowerCase()
    .replace(/[\s\u4e00-\u9fa5]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'skill'
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const prompt = await prisma.prompt.findUnique({
    where: { id: Number(params.id), isDeleted: false },
    include: {
      categories: { include: { category: { include: { dimension: true } } } },
      tags: { include: { tag: true } },
    },
  })

  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (prompt.visibility !== 'PUBLIC' && prompt.userId !== payload.userId && payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const skillName = toSkillName(prompt.title)
  const cats = prompt.categories.map(c => `${c.category.dimension?.name}/${c.category.name}`).join(', ')
  const tags = prompt.tags.map(t => t.tag.name).join(', ')

  const skillMd = [
    `---`,
    `name: ${skillName}`,
    `description: ${prompt.description || prompt.title}`,
    cats ? `categories: ${cats}` : null,
    tags ? `tags: ${tags}` : null,
    prompt.author ? `author: ${prompt.author}` : null,
    `---`,
    ``,
    prompt.content,
  ].filter(line => line !== null).join('\n')

  const zip = new JSZip()
  zip.folder(skillName)!.file('SKILL.md', skillMd)

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${skillName}.zip"`,
    },
  })
}
