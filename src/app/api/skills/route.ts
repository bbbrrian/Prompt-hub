import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenWithUser, COOKIE_NAME } from '@/lib/auth'
import { validateTags, resolveTagIds } from '@/lib/tag-utils'

export const dynamic = 'force-dynamic'

const MAX_JSON_SIZE = 1024 * 1024

function isJsonTooLarge(val: unknown): boolean {
  if (val === undefined || val === null) return false
  return JSON.stringify(val).length > MAX_JSON_SIZE
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Math.floor(Number(searchParams.get('page') || '1')) || 1)
  const pageSize = Math.min(Math.max(1, Math.floor(Number(searchParams.get('pageSize') || '12')) || 12), 100)
  const search = searchParams.get('search') || ''
  const tag = searchParams.get('tag') || ''

  const where: Prisma.SkillWhereInput = { isDeleted: false }
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
    const { name, description, content, references, scripts, assets, promptId, author, tags } = body

    if (!name || typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'name 不合法' }, { status: 400 })
    }
    if (!content || typeof content !== 'string' || content.length > 100000) {
      return NextResponse.json({ error: 'content 不合法' }, { status: 400 })
    }
    if (tags !== undefined && tags !== null && !validateTags(tags)) {
      return NextResponse.json({ error: 'tags 不合法' }, { status: 400 })
    }
    if (isJsonTooLarge(references) || isJsonTooLarge(scripts) || isJsonTooLarge(assets)) {
      return NextResponse.json({ error: 'JSONB 字段超过 1MB 限制' }, { status: 400 })
    }
    if (promptId !== undefined && promptId !== null) {
      if (typeof promptId !== 'number' || !Number.isInteger(promptId)) {
        return NextResponse.json({ error: 'promptId 不合法' }, { status: 400 })
      }
      const prompt = await prisma.prompt.findUnique({ where: { id: promptId } })
      if (!prompt || prompt.isDeleted) {
        return NextResponse.json({ error: 'promptId 对应的提示词不存在' }, { status: 400 })
      }
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
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
