import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [
    totalPrompts,
    totalSkills,
    totalCategories,
    totalTags,
    copyAgg,
    promptsByDimension,
    topPrompts,
    recentPrompts,
    tagDistribution,
    categoryCopyRaw,
    tagCopyRaw,
  ] = await Promise.all([
    prisma.prompt.count({ where: { isDeleted: false } }),
    prisma.skill.count(),
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
    prisma.category.findMany({
      select: {
        name: true,
        prompts: {
          where: { prompt: { isDeleted: false } },
          select: { prompt: { select: { copyCount: true } } },
        },
      },
    }),
    prisma.tag.findMany({
      select: {
        name: true,
        prompts: {
          select: { prompt: { select: { copyCount: true } } },
        },
      },
    }),
  ])

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

  const categoryCopyStats = (categoryCopyRaw as any[])
    .map(c => ({
      name: c.name,
      copyCount: (c.prompts as any[]).reduce((sum, p) => sum + (p.prompt.copyCount || 0), 0),
    }))
    .filter(c => c.copyCount > 0)
    .sort((a, b) => b.copyCount - a.copyCount)
    .slice(0, 10)

  const tagCopyStats = (tagCopyRaw as any[])
    .map(t => ({
      name: t.name,
      copyCount: (t.prompts as any[]).reduce((sum, p) => sum + (p.prompt.copyCount || 0), 0),
    }))
    .filter(t => t.copyCount > 0)
    .sort((a, b) => b.copyCount - a.copyCount)
    .slice(0, 10)

  return NextResponse.json({
    totalPrompts,
    totalSkills,
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
  })
}
