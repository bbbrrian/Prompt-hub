import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: Number(params.id) },
    include: {
      steps: {
        include: { prompt: { select: { id: true, title: true, content: true, variables: true } } },
        orderBy: { stepOrder: 'asc' },
      },
    },
  })
  if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(workflow)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null

  const { name, description, steps } = await req.json()

  const current = await prisma.workflow.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (current.userId !== null && payload?.userId !== current.userId && payload?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.workflowStep.deleteMany({ where: { workflowId: id } })

  const workflow = await prisma.workflow.update({
    where: { id },
    data: {
      name,
      description,
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

  return NextResponse.json(workflow)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null

  const current = await prisma.workflow.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (current.userId !== null && payload?.userId !== current.userId && payload?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.workflow.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
