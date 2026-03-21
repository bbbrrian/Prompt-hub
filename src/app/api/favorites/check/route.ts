import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { COOKIE_NAME } from '@/lib/auth'
import { verifyTokenWithUser } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({})
  const payload = await verifyTokenWithUser(token)
  if (!payload) return NextResponse.json({})

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'prompt'
  const ids = searchParams.get('ids')?.split(',').map(Number).filter(n => Number.isInteger(n) && n > 0) || []
  if (ids.length === 0) return NextResponse.json({})
  if (ids.length > 100) return NextResponse.json({ error: 'Too many ids, max 100' }, { status: 400 })

  let favorites: any[] = []
  const result: Record<number, boolean> = {}

  if (type === 'skill') {
    favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId, skillId: { in: ids }, targetType: 'skill' },
      select: { skillId: true },
    })
    favorites.forEach((f: any) => { result[f.skillId] = true })
  } else if (type === 'agent') {
    favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId, agentId: { in: ids }, targetType: 'agent' },
      select: { agentId: true },
    })
    favorites.forEach((f: any) => { result[f.agentId] = true })
  } else {
    favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId, promptId: { in: ids } },
      select: { promptId: true },
    })
    favorites.forEach((f: any) => { result[f.promptId] = true })
  }

  return NextResponse.json(result)
}
