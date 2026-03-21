import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  const currentDeptId = request.headers.get('x-user-department-id')

  if (role !== 'SUPER_ADMIN' && role !== 'DEPT_ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const action = searchParams.get('action')
  const targetType = searchParams.get('targetType')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Number(searchParams.get('pageSize') || '20')

  const where: any = {}

  if (role === 'DEPT_ADMIN' && currentDeptId) {
    const deptUsers = await prisma.user.findMany({
      where: { departmentId: Number(currentDeptId) },
      select: { id: true }
    })
    where.userId = { in: deptUsers.map(u => u.id) }
  }

  if (userId) where.userId = Number(userId)
  if (action) where.action = action
  if (targetType) where.targetType = targetType
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.auditLog.count({ where })
  ])

  return NextResponse.json({ logs, total, page, pageSize })
}
