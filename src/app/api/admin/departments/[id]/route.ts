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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getSuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

  const { id } = await params
  const deptId = Number(id)
  const { name, parentId } = await request.json()

  const existing = await prisma.department.findUnique({ where: { id: deptId } })
  if (!existing) return NextResponse.json({ error: '部门不存在' }, { status: 404 })

  if (name && name !== existing.name) {
    const dup = await prisma.department.findUnique({ where: { name } })
    if (dup) return NextResponse.json({ error: '部门名称已存在' }, { status: 400 })
  }

  if (parentId === deptId) return NextResponse.json({ error: '不能将部门设为自己的子部门' }, { status: 400 })

  const dept = await prisma.department.update({
    where: { id: deptId },
    data: { name: name || existing.name, parentId: parentId !== undefined ? parentId : existing.parentId }
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.userId,
      action: 'UPDATE',
      targetType: 'Department',
      targetId: deptId,
      detail: { name, parentId }
    }
  })

  return NextResponse.json(dept)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getSuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

  const { id } = await params
  const deptId = Number(id)

  const dept = await prisma.department.findUnique({
    where: { id: deptId },
    include: { _count: { select: { users: true, children: true } } }
  })
  if (!dept) return NextResponse.json({ error: '部门不存在' }, { status: 404 })
  if (dept._count.users > 0) return NextResponse.json({ error: '部门下有用户，无法删除' }, { status: 400 })
  if (dept._count.children > 0) return NextResponse.json({ error: '部门下有子部门，无法删除' }, { status: 400 })

  await prisma.department.delete({ where: { id: deptId } })

  await prisma.auditLog.create({
    data: {
      userId: admin.userId,
      action: 'DELETE',
      targetType: 'Department',
      targetId: deptId,
      detail: { name: dept.name }
    }
  })

  return NextResponse.json({ success: true })
}
