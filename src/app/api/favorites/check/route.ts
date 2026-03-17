import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({})
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({})

  const { searchParams } = new URL(req.url)
  const promptIds = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || []
  if (promptIds.length === 0) return NextResponse.json({})

  const favorites = await (prisma as any).favorite.findMany({
    where: { userId: payload.userId, promptId: { in: promptIds } },
    select: { promptId: true },
  })

  const result: Record<number, boolean> = {}
  favorites.forEach((f: any) => { result[f.promptId] = true })
  return NextResponse.json(result)
}
