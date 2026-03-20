import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenWithUser, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({})
  const payload = await verifyTokenWithUser(token)
  if (!payload) return NextResponse.json({})

  const { searchParams } = new URL(req.url)
  const promptIds = searchParams.get('ids')?.split(',').map(Number).filter(n => Number.isInteger(n) && n > 0) || []
  if (promptIds.length === 0) return NextResponse.json({})
  if (promptIds.length > 100) return NextResponse.json({ error: 'Too many ids, max 100' }, { status: 400 })

  const favorites = await prisma.favorite.findMany({
    where: { userId: payload.userId, promptId: { in: promptIds } },
    select: { promptId: true },
  })

  const result: Record<number, boolean> = {}
  favorites.forEach((f: any) => { result[f.promptId] = true })
  return NextResponse.json(result)
}
