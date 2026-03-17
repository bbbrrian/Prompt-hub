import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const versions = await prisma.promptVersion.findMany({
    where: { promptId: Number(params.id) },
    orderBy: { version: 'desc' },
  })
  return NextResponse.json(versions)
}
