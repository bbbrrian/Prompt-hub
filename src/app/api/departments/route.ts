import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { id: 'asc' },
    include: { children: true }
  })
  return NextResponse.json(departments)
}
