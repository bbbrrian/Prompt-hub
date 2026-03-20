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

  const favorites = await prisma.favorite.findMany({
    where: { userId: payload.userId, prompt: { isDeleted: false } },
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
  const { promptId } = body
  if (!Number.isInteger(promptId) || promptId <= 0) {
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

    await prisma.favorite.create({ data: { userId: payload.userId, promptId } })
    return NextResponse.json({ favorited: true })
  } catch {
    return NextResponse.json({ error: '操作失败，请重试' }, { status: 409 })
  }
}
