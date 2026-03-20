import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { COOKIE_NAME } from '@/lib/auth'
import { verifyTokenWithUser } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

let statsCache: { data: unknown; ts: number } | null = null
const CACHE_TTL = 60_000

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value
    const payload = token ? await verifyTokenWithUser(token) : null
    if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

    if (statsCache && Date.now() - statsCache.ts < CACHE_TTL) {
      return NextResponse.json(statsCache.data)
    }

    const [
      totalPrompts,
      totalSkills,
      totalAgents,
      totalCategories,
      totalTags,
      copyAgg,
      promptsByDimension,
      topPrompts,
      recentPrompts,
      tagDistribution,
    ] = await Promise.all([
      prisma.prompt.count({ where: { isDeleted: false } }),
      prisma.skill.count({ where: { isDeleted: false } }),
      prisma.agent.count({ where: { isDeleted: false } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.prompt.aggregate({ _sum: { copyCount: true }, where: { isDeleted: false } }),
      prisma.dimension.findMany({
        select: {
          name: true,
          categories: {
            select: {
              _count: { select: { prompts: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.prompt.findMany({
        where: { isDeleted: false },
        select: { title: true, copyCount: true },
        orderBy: { copyCount: 'desc' },
        take: 10,
      }),
      prisma.prompt.findMany({
        where: { isDeleted: false },
        select: { title: true, author: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.tag.findMany({
        select: {
          name: true,
          _count: { select: { prompts: true } },
        },
      }),
    ])

    const categoryCopyStats: { name: string; copyCount: number }[] = await prisma.$queryRaw`
      SELECT c.name, COALESCE(SUM(p.copy_count), 0)::int AS "copyCount"
      FROM category c
      JOIN prompt_category pc ON pc.category_id = c.id
      JOIN prompt p ON p.id = pc.prompt_id AND p.is_deleted = false
      GROUP BY c.name
      HAVING SUM(p.copy_count) > 0
      ORDER BY "copyCount" DESC
      LIMIT 10
    `

    const tagCopyStats: { name: string; copyCount: number }[] = await prisma.$queryRaw`
      SELECT t.name, COALESCE(SUM(p.copy_count), 0)::int AS "copyCount"
      FROM tag t
      JOIN prompt_tag pt ON pt.tag_id = t.id
      JOIN prompt p ON p.id = pt.prompt_id AND p.is_deleted = false
      GROUP BY t.name
      HAVING SUM(p.copy_count) > 0
      ORDER BY "copyCount" DESC
      LIMIT 10
    `

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentCreated = await prisma.prompt.findMany({
      where: { isDeleted: false, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    })

    const days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    const countMap: Record<string, number> = {}
    recentCreated.forEach(p => {
      const day = p.createdAt.toISOString().slice(0, 10)
      countMap[day] = (countMap[day] || 0) + 1
    })
    const copyTrend = days.map(date => ({ date, count: countMap[date] || 0 }))

    const dimensionData = promptsByDimension.map(d => ({
      name: d.name,
      value: d.categories.reduce((sum, c) => sum + c._count.prompts, 0),
    }))

    const tagData = tagDistribution.map(t => ({
      name: t.name,
      value: t._count.prompts,
    }))

    const result = {
      totalPrompts,
      totalSkills,
      totalAgents,
      totalCopies: copyAgg._sum.copyCount || 0,
      totalCategories,
      totalTags,
      promptsByDimension: dimensionData,
      topPrompts,
      recentPrompts,
      tagDistribution: tagData,
      copyTrend,
      categoryCopyStats,
      tagCopyStats,
    }

    statsCache = { data: result, ts: Date.now() }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
