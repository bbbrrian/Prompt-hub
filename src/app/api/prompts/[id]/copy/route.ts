import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const prompt = await prisma.prompt.update({
    where: { id: Number(params.id) },
    data: { copyCount: { increment: 1 } },
    select: { copyCount: true },
  })

  return NextResponse.json(prompt)
}
