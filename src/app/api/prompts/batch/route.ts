import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { action, ids, categoryIds, tagIds, visibility, department } = await req.json()

  if (!ids?.length) return NextResponse.json({ error: 'ids required' }, { status: 400 })

  // 所有权校验：非 admin 只能操作自己的 prompt
  if (payload.role !== 'admin' && action !== 'export-skill') {
    const owned = await prisma.prompt.findMany({
      where: { id: { in: ids }, userId: payload.userId },
      select: { id: true },
    })
    const ownedIds = new Set(owned.map((p: { id: number }) => p.id))
    const unauthorized = ids.filter((id: number) => !ownedIds.has(id))
    if (unauthorized.length > 0) {
      return NextResponse.json({ error: '无权操作部分 prompt' }, { status: 403 })
    }
  }

  switch (action) {
    case 'delete':
      await prisma.prompt.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true },
      })
      break

    case 'move':
      if (!categoryIds?.length) return NextResponse.json({ error: 'categoryIds required' }, { status: 400 })
      await prisma.$transaction([
        prisma.promptCategory.deleteMany({ where: { promptId: { in: ids } } }),
        ...ids.flatMap((pid: number) =>
          categoryIds.map((cid: number) =>
            prisma.promptCategory.create({ data: { promptId: pid, categoryId: cid } })
          )
        ),
      ])
      break

    case 'tag':
      if (!tagIds?.length) return NextResponse.json({ error: 'tagIds required' }, { status: 400 })
      await prisma.$transaction(
        ids.flatMap((pid: number) =>
          tagIds.map((tid: number) =>
            prisma.promptTag.upsert({
              where: { promptId_tagId: { promptId: pid, tagId: tid } },
              create: { promptId: pid, tagId: tid },
              update: {},
            })
          )
        )
      )
      break

    case 'visibility':
      if (!visibility) return NextResponse.json({ error: 'visibility required' }, { status: 400 })
      await prisma.prompt.updateMany({
        where: { id: { in: ids } },
        data: { visibility, department: department || null },
      })
      break

    case 'export-skill': {
      const JSZip = (await import('jszip')).default
      const prompts = await prisma.prompt.findMany({
        where: { id: { in: ids }, isDeleted: false },
        include: {
          categories: { include: { category: { include: { dimension: true } } } },
          tags: { include: { tag: true } },
        },
      })
      const zip = new JSZip()
      const usedNames = new Set<string>()
      for (const p of prompts) {
        let skillName = p.title.toLowerCase().replace(/[\s\u4e00-\u9fa5]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'skill'
        if (usedNames.has(skillName)) skillName = `${skillName}-${p.id}`
        usedNames.add(skillName)
        const cats = p.categories.map((c: any) => `${c.category.dimension?.name}/${c.category.name}`).join(', ')
        const tags = p.tags.map((t: any) => t.tag.name).join(', ')
        const skillMd = [`---`, `name: ${skillName}`, `description: ${p.description || p.title}`, cats ? `categories: ${cats}` : null, tags ? `tags: ${tags}` : null, p.author ? `author: ${p.author}` : null, `---`, ``, p.content].filter(l => l !== null).join('\n')
        zip.folder(skillName)!.file('SKILL.md', skillMd)
      }
      const buffer = await zip.generateAsync({ type: 'nodebuffer' })
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="skills.zip"' },
      })
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
