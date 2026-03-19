import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'json'
  const categoryId = searchParams.get('categoryId')
  const tagId = searchParams.get('tagId')
  const idsParam = searchParams.get('ids')

  const where: any = { isDeleted: false }
  if (payload.role !== 'admin') where.visibility = 'PUBLIC'
  if (idsParam) {
    where.id = { in: idsParam.split(',').map(Number) }
  } else {
    if (categoryId) where.categories = { some: { categoryId: Number(categoryId) } }
    if (tagId) where.tags = { some: { tagId: Number(tagId) } }
  }

  const items = await prisma.prompt.findMany({
    where,
    include: {
      categories: { include: { category: { include: { dimension: true } } } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (format === 'markdown') {
    const md = items.map(p => {
      const cats = p.categories.map(c => `${c.category.dimension?.name}/${c.category.name}`).join(', ')
      const tags = p.tags.map(t => t.tag.name).join(', ')
      return `## ${p.title}\n\n${p.description ? `> ${p.description}\n\n` : ''}**作者:** ${p.author || '未知'} | **分类:** ${cats || '无'} | **标签:** ${tags || '无'}\n\n\`\`\`\n${p.content}\n\`\`\`\n`
    }).join('\n---\n\n')

    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="prompts.md"',
      },
    })
  }

  const data = items.map(p => ({
    title: p.title,
    content: p.content,
    description: p.description,
    author: p.author,
    variables: p.variables,
    categories: p.categories.map(c => ({
      dimension: c.category.dimension?.name,
      category: c.category.name,
    })),
    tags: p.tags.map(t => t.tag.name),
  }))

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="prompts.json"',
    },
  })
}
