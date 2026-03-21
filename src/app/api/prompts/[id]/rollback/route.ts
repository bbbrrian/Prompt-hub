import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { canModify, writeAuditLog, UserPayload } from '@/lib/permission'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const id = Number(params.id)
  const { versionId } = await req.json()

  const ver = await prisma.promptVersion.findUnique({ where: { id: versionId } })
  if (!ver || ver.promptId !== id) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  const current = await prisma.prompt.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const user: UserPayload = {
    userId: payload.userId,
    email: payload.email,
    role: (payload.role || 'USER') as UserPayload['role'],
    departmentId: payload.departmentId ?? null
  }

  if (!canModify(user, current)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

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

  await writeAuditLog(user.userId, 'ROLLBACK', 'Prompt', id, { versionId, toVersion: ver.version })

  return NextResponse.json(prompt)
}
