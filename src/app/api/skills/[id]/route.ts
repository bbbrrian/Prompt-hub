import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const skill = await prisma.skill.findUnique({
    where: { id: Number(params.id), isDeleted: false },
    include: {
      prompt: { select: { id: true, title: true } },
      user: { select: { id: true, email: true } },
      tags: { include: { tag: true } },
    },
  })
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(skill)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const id = Number(params.id)
  const existing = await prisma.skill.findUnique({ where: { id, isDeleted: false } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.userId && existing.userId !== payload.userId && payload.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, content, references, scripts, assets, author, tags } = body

  if (tags !== undefined) {
    await prisma.skillTag.deleteMany({ where: { skillId: id } })
  }

  const skill = await prisma.skill.update({
    where: { id },
    data: {
      name: name ?? undefined,
      description: description ?? undefined,
      content: content ?? undefined,
      references: references !== undefined ? references : undefined,
      scripts: scripts !== undefined ? scripts : undefined,
      assets: assets !== undefined ? assets : undefined,
      author: author !== undefined ? author : undefined,
      version: { increment: 1 },
      tags: tags?.length ? {
        create: await resolveTagIds(tags),
      } : undefined,
    },
    include: {
      prompt: { select: { id: true, title: true } },
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json(skill)
}

async function resolveTagIds(tagNames: string[]) {
  const result = []
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    })
    result.push({ tagId: tag.id })
  }
  return result
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const id = Number(params.id)
  const existing = await prisma.skill.findUnique({ where: { id, isDeleted: false } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.userId && existing.userId !== payload.userId && payload.role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  await prisma.skill.update({ where: { id }, data: { isDeleted: true } })
  return NextResponse.json({ success: true })
}
