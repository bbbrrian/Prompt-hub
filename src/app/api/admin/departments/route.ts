import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getSuperAdmin(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (role !== 'SUPER_ADMIN') return null
  return {
    userId: Number(request.headers.get('x-user-id')),
    role
  }
}

export async function GET(request: NextRequest) {
  const admin = getSuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

  const departments = await prisma.department.findMany({
    orderBy: { id: 'asc' },
    include: {
      children: true,
      _count: { select: { users: true } }
    }
  })
  return NextResponse.json(departments)
}

export async function POST(request: NextRequest) {
  const admin = getSuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

  const { name, parentId } = await request.json()
  if (!name) return NextResponse.json({ error: '部门名称不能为空' }, { status: 400 })

  const existing = await prisma.department.findUnique({ where: { name } })
  if (existing) return NextResponse.json({ error: '部门名称已存在' }, { status: 400 })

  if (parentId) {
    const parent = await prisma.department.findUnique({ where: { id: parentId } })
    if (!parent) return NextResponse.json({ error: '父部门不存在' }, { status: 400 })
  }

  const dept = await prisma.department.create({
    data: { name, parentId: parentId || null }
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.userId,
      action: 'CREATE',
      targetType: 'Department',
      targetId: dept.id,
      detail: { name, parentId }
    }
  })

  return NextResponse.json(dept, { status: 201 })
}
