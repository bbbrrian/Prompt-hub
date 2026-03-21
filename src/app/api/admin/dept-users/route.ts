import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  const deptId = request.headers.get('x-user-department-id')

  if (role !== 'SUPER_ADMIN' && role !== 'DEPT_ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  if (!deptId) {
    return NextResponse.json({ error: '未分配部门' }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: { departmentId: Number(deptId) },
    select: {
      id: true,
      email: true,
      role: true,
      disabled: true,
      createdAt: true
    },
    orderBy: { id: 'asc' }
  })

  return NextResponse.json(users)
}
