import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const workflows = await prisma.workflow.findMany({
    include: {
      steps: {
        include: { prompt: { select: { id: true, title: true } } },
        orderBy: { stepOrder: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(workflows)
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null

  const { name, description, steps } = await req.json()

  const workflow = await prisma.workflow.create({
    data: {
      name,
      description,
      userId: payload?.userId ?? undefined,
      steps: {
        create: (steps || []).map((s: any, i: number) => ({
          promptId: s.promptId,
          stepOrder: i,
          inputMapping: s.inputMapping || undefined,
        })),
      },
    },
    include: {
      steps: {
        include: { prompt: { select: { id: true, title: true } } },
        orderBy: { stepOrder: 'asc' },
      },
    },
  })

  return NextResponse.json(workflow, { status: 201 })
}
