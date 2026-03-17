import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const { versionId } = await req.json()

  const ver = await prisma.promptVersion.findUnique({ where: { id: versionId } })
  if (!ver || ver.promptId !== id) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  const current = await prisma.prompt.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.promptVersion.create({
    data: {
      promptId: id,
      version: current.version,
      title: current.title,
      content: current.content,
      description: current.description,
      author: current.author,
      variables: current.variables || undefined,
    },
  })

  const prompt = await prisma.prompt.update({
    where: { id },
    data: {
      title: ver.title,
      content: ver.content,
      description: ver.description,
      author: ver.author,
      variables: ver.variables || undefined,
      version: { increment: 1 },
    },
  })

  return NextResponse.json(prompt)
}
