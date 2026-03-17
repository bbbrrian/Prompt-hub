import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const id = Number(params.id)
  const prompt = await prisma.prompt.findUnique({ where: { id } })
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (prompt.userId !== payload.userId && payload.role !== 'ADMIN' && prompt.visibility !== 'PUBLIC') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const versions = await prisma.promptVersion.findMany({
    where: { promptId: id },
    orderBy: { version: 'desc' },
  })
  return NextResponse.json(versions)
}
