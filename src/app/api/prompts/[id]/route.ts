import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { canModify, writeAuditLog, UserPayload } from '@/lib/permission'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null

  const prompt = await prisma.prompt.findUnique({
    where: { id: Number(params.id), isDeleted: false },
    include: {
      categories: { include: { category: { include: { dimension: true } } } },
      tags: { include: { tag: true } },
    },
  })

  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (prompt.visibility !== 'PUBLIC' && prompt.userId !== payload?.userId && payload?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(prompt)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json()
  const { title, content, description, author, categoryIds, tagIds, variables, visibility, department } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    return NextResponse.json({ error: 'title 不合法' }, { status: 400 })
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 100000) {
    return NextResponse.json({ error: 'content 不合法' }, { status: 400 })
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
    return NextResponse.json({ error: '无权限修改此内容' }, { status: 403 })
  }

  await prisma.$transaction([
    prisma.promptVersion.create({
      data: {
        promptId: id,
        version: current.version,
        title: current.title,
        content: current.content,
        description: current.description,
        author: current.author,
        variables: current.variables || undefined,
      },
    }),
    prisma.promptCategory.deleteMany({ where: { promptId: id } }),
    prisma.promptTag.deleteMany({ where: { promptId: id } }),
  ])

  const prompt = await prisma.prompt.update({
    where: { id },
    data: {
      title,
      content,
      description,
      author,
      variables: variables || undefined,
      visibility: visibility || undefined,
      department: department || undefined,
      version: { increment: 1 },
      categories: categoryIds?.length
        ? { create: categoryIds.map((cid: number) => ({ categoryId: cid })) }
        : undefined,
      tags: tagIds?.length
        ? { create: tagIds.map((tid: number) => ({ tagId: tid })) }
        : undefined,
    },
    include: {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  })

  await writeAuditLog(user.userId, 'UPDATE', 'Prompt', id, { title: body.title })

  return NextResponse.json(prompt)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const current = await prisma.prompt.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const user: UserPayload = {
    userId: payload.userId,
    email: payload.email,
    role: (payload.role || 'USER') as UserPayload['role'],
    departmentId: payload.departmentId ?? null
  }

  if (!canModify(user, current)) {
    return NextResponse.json({ error: '无权限删除此内容' }, { status: 403 })
  }

  await prisma.prompt.update({
    where: { id },
    data: { isDeleted: true },
  })

  await writeAuditLog(user.userId, 'DELETE', 'Prompt', id, { title: current.title })

  return NextResponse.json({ success: true })
}
