import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { COOKIE_NAME } from '@/lib/auth'
import { verifyTokenWithUser } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyTokenWithUser(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'prompt'

  if (type === 'skill') {
    const favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId, targetType: 'skill', skill: { isDeleted: false } },
      include: { skill: { include: { tags: { include: { tag: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(favorites.map((f: any) => f.skill))
  }

  if (type === 'agent') {
    const favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId, targetType: 'agent', agent: { isDeleted: false } },
      include: { agent: { include: { tags: { include: { tag: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(favorites.map((f: any) => f.agent))
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: payload.userId, targetType: 'prompt', prompt: { isDeleted: false } },
    include: {
      prompt: {
        include: {
          categories: { include: { category: { include: { dimension: true } } } },
          tags: { include: { tag: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(favorites.map((f: any) => f.prompt))
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyTokenWithUser(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { promptId, skillId, agentId } = body

  if (skillId) {
    const skill = await prisma.skill.findFirst({ where: { id: skillId, isDeleted: false } })
    if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    try {
      const existing = await prisma.favorite.findUnique({
        where: { userId_skillId: { userId: payload.userId, skillId } },
      })
      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } })
        return NextResponse.json({ favorited: false })
      }
      await prisma.favorite.create({ data: { userId: payload.userId, skillId, targetType: 'skill' } })
      return NextResponse.json({ favorited: true })
    } catch {
      return NextResponse.json({ error: '操作失败' }, { status: 409 })
    }
  }

  if (agentId) {
    const agent = await prisma.agent.findFirst({ where: { id: agentId, isDeleted: false } })
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    try {
      const existing = await prisma.favorite.findUnique({
        where: { userId_agentId: { userId: payload.userId, agentId } },
      })
      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } })
        return NextResponse.json({ favorited: false })
      }
      await prisma.favorite.create({ data: { userId: payload.userId, agentId, targetType: 'agent' } })
      return NextResponse.json({ favorited: true })
    } catch {
      return NextResponse.json({ error: '操作失败' }, { status: 409 })
    }
  }

  if (!promptId || !Number.isInteger(promptId) || promptId <= 0) {
    return NextResponse.json({ error: 'promptId must be a positive integer' }, { status: 400 })
  }

  const prompt = await prisma.prompt.findFirst({ where: { id: promptId, isDeleted: false } })
  if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_promptId: { userId: payload.userId, promptId } },
    })
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      return NextResponse.json({ favorited: false })
    }
    await prisma.favorite.create({ data: { userId: payload.userId, promptId, targetType: 'prompt' } })
    return NextResponse.json({ favorited: true })
  } catch {
    return NextResponse.json({ error: '操作失败，请重试' }, { status: 409 })
  }
}
