import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, verifyTokenWithUser, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Math.min(Number(searchParams.get('pageSize') || '12'), 100)
  const categoryId = searchParams.get('categoryId')
  const tagId = searchParams.get('tagId')
  const mine = searchParams.get('mine') === '1'

  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  const currentUserId = payload?.userId ?? null

  const where: any = { isDeleted: false }

  if (mine && currentUserId) {
    where.userId = currentUserId
  } else if (currentUserId) {
    where.OR = [
      { userId: currentUserId },
      { userId: null },
      { visibility: 'PUBLIC' },
    ]
  } else {
    where.visibility = 'PUBLIC'
  }

  if (categoryId) {
    where.categories = { some: { categoryId: Number(categoryId) } }
  }
  if (tagId) {
    where.tags = { some: { tagId: Number(tagId) } }
  }

  try {
    const [items, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: {
          categories: { include: { category: { include: { dimension: true } } } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.prompt.count({ where }),
    ])
    return NextResponse.json({ items, total, page, pageSize })
  } catch (e) {
    return NextResponse.json({ items: [], total: 0, page, pageSize }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyTokenWithUser(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json()
  const { title, content, description, author, categoryIds, tagIds, variables, visibility, department } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    return NextResponse.json({ error: 'title 不合法' }, { status: 400 })
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 100000) {
    return NextResponse.json({ error: 'content 不合法' }, { status: 400 })
  }

  try {
    const prompt = await prisma.prompt.create({
      data: {
        title,
        content,
        description,
        author,
        userId: payload?.userId ?? undefined,
        variables: variables || undefined,
        visibility: visibility || undefined,
        department: department || undefined,
        categories: categoryIds?.length
          ? { create: categoryIds.map((id: number) => ({ categoryId: id })) }
          : undefined,
        tags: tagIds?.length
          ? { create: tagIds.map((id: number) => ({ tagId: id })) }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    })
    return NextResponse.json(prompt, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/prompts error:', e)
    return NextResponse.json({ error: e?.message || '数据库错误' }, { status: 500 })
  }
}
