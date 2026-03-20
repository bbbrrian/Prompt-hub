import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenWithUser, COOKIE_NAME } from '@/lib/auth'
import { validateTags, resolveTagIds } from '@/lib/tag-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Math.floor(Number(searchParams.get('page') || '1')) || 1)
  const pageSize = Math.min(Math.max(1, Math.floor(Number(searchParams.get('pageSize') || '12')) || 12), 100)
  const search = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''

  const where: Prisma.AgentWhereInput = { isDeleted: false }
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

  try {
    const [items, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          user: { select: { id: true, email: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.agent.count({ where }),
    ])
    return NextResponse.json({ items, total, page, pageSize })
  } catch {
    return NextResponse.json({ items: [], total: 0, page, pageSize }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyTokenWithUser(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, description, systemPrompt, tools, model, author, tags } = body

    if (!name || typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'name 不合法' }, { status: 400 })
    }
    if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.length > 100000) {
      return NextResponse.json({ error: 'systemPrompt 不合法' }, { status: 400 })
    }
    if (tags !== undefined && tags !== null && !validateTags(tags)) {
      return NextResponse.json({ error: 'tags 不合法' }, { status: 400 })
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description: description || '',
        systemPrompt,
        tools: tools || undefined,
        model: model || undefined,
        author: author || undefined,
        userId: payload.userId,
        tags: tags?.length ? {
          create: await resolveTagIds(tags),
        } : undefined,
      },
      include: {
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
