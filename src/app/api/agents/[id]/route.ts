import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'
import { verifyTokenWithUser } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await prisma.agent.findUnique({
    where: { id: Number(params.id), isDeleted: false },
    include: {
      user: { select: { id: true, email: true } },
      tags: { include: { tag: true } },
    },
  })
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agent)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyTokenWithUser(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const id = Number(params.id)
    const existing = await prisma.agent.findUnique({ where: { id, isDeleted: false } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.userId && existing.userId !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, systemPrompt, tools, model, author, tags } = body

    if (tags !== undefined) {
      await prisma.agentTag.deleteMany({ where: { agentId: id } })
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        systemPrompt: systemPrompt ?? undefined,
        tools: tools !== undefined ? tools : undefined,
        model: model !== undefined ? model : undefined,
        author: author !== undefined ? author : undefined,
        version: { increment: 1 },
        tags: tags?.length ? {
          create: await resolveTagIds(tags),
        } : undefined,
      },
      include: {
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(agent)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '数据库错误' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyTokenWithUser(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const id = Number(params.id)
    const existing = await prisma.agent.findUnique({ where: { id, isDeleted: false } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.userId && existing.userId !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    await prisma.agent.update({ where: { id }, data: { isDeleted: true } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '数据库错误' }, { status: 500 })
  }
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
