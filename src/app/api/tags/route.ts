import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tags)
  } catch (e) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const body = await req.json()
  const tag = await prisma.tag.create({
    data: { name: body.name, color: body.color || '#1e50ae' },
  })
  return NextResponse.json(tag, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  await prisma.tag.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
