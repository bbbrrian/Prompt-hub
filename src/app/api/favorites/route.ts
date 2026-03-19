import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenWithUser, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyTokenWithUser(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const favorites = await (prisma as any).favorite.findMany({
    where: { userId: payload.userId },
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

  const { promptId } = await req.json()
  if (!promptId) return NextResponse.json({ error: 'promptId required' }, { status: 400 })

  const existing = await (prisma as any).favorite.findUnique({
    where: { userId_promptId: { userId: payload.userId, promptId } },
  })

  if (existing) {
    await (prisma as any).favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }

  await (prisma as any).favorite.create({ data: { userId: payload.userId, promptId } })
  return NextResponse.json({ favorited: true })
}
