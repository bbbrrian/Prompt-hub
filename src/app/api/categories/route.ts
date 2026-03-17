import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const dimensions = await prisma.dimension.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    return NextResponse.json(dimensions)
  } catch (e) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type } = body

  if (type === 'dimension') {
    const dimension = await prisma.dimension.create({
      data: { name: body.name, sortOrder: body.sortOrder || 0 },
    })
    return NextResponse.json(dimension, { status: 201 })
  }

  const category = await prisma.category.create({
    data: {
      name: body.name,
      dimensionId: body.dimensionId,
      parentId: body.parentId || null,
      sortOrder: body.sortOrder || 0,
    },
  })
  return NextResponse.json(category, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { type } = body

  if (type === 'dimension') {
    const dimension = await prisma.dimension.update({
      where: { id: body.id },
      data: { name: body.name, sortOrder: body.sortOrder },
    })
    return NextResponse.json(dimension)
  }

  const category = await prisma.category.update({
    where: { id: body.id },
    data: {
      name: body.name,
      parentId: body.parentId,
      sortOrder: body.sortOrder,
    },
  })
  return NextResponse.json(category)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = Number(searchParams.get('id'))

  if (type === 'dimension') {
    await prisma.dimension.delete({ where: { id } })
  } else {
    await prisma.category.delete({ where: { id } })
  }

  return NextResponse.json({ success: true })
}
