import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const keyword = (searchParams.get('q') || '').slice(0, 100)
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Math.min(Number(searchParams.get('pageSize') || '12'), 50)

  if (!keyword.trim()) {
    return NextResponse.json({ items: [], total: 0 })
  }

  const where = {
    isDeleted: false,
    visibility: 'PUBLIC' as const,
    OR: [
      { title: { contains: keyword, mode: 'insensitive' as const } },
      { content: { contains: keyword, mode: 'insensitive' as const } },
      { description: { contains: keyword, mode: 'insensitive' as const } },
    ],
  }

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

  return NextResponse.json({ items, total, page, pageSize, keyword })
}
