import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
  const body = await req.json()
  const tag = await prisma.tag.create({
    data: { name: body.name, color: body.color || '#00ffff' },
  })
  return NextResponse.json(tag, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  await prisma.tag.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
