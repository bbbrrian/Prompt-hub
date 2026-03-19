import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Math.min(Number(searchParams.get('pageSize') || '12'), 100)
  const search = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''

  const where: any = { isDeleted: false }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (tag) {
    where.tags = { some: { tag: { name: tag } } }
  }

  const [items, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      include: {
        prompt: { select: { id: true, title: true } },
        user: { select: { id: true, email: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.skill.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json()
  const { name, description, content, references, scripts, assets, promptId, author, tags } = body

  if (!name || typeof name !== 'string' || name.length > 200) {
    return NextResponse.json({ error: 'name 不合法' }, { status: 400 })
  }
  if (!content || typeof content !== 'string' || content.length > 100000) {
    return NextResponse.json({ error: 'content 不合法' }, { status: 400 })
  }

  const skill = await prisma.skill.create({
    data: {
      name,
      description: description || '',
      content,
      references: references || undefined,
      scripts: scripts || undefined,
      assets: assets || undefined,
      author: author || undefined,
      promptId: promptId || undefined,
      userId: payload?.userId ?? undefined,
      tags: tags?.length ? {
        create: await resolveTagIds(tags),
      } : undefined,
    },
    include: {
      prompt: { select: { id: true, title: true } },
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json(skill, { status: 201 })
}

async function resolveTagIds(tagNames: string[]) {
  const result = []
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    })
    result.push({ tagId: tag.id })
  }
  return result
}
