import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function getSuperAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'SUPER_ADMIN') return null
  return { userId: payload.userId, role: payload.role }
}

export async function GET(request: NextRequest) {
  const admin = await getSuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const departmentId = searchParams.get('departmentId')
  const role = searchParams.get('role')
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Number(searchParams.get('pageSize') || '20')

  const where: any = {}
  if (search) where.email = { contains: search, mode: 'insensitive' }
  if (departmentId) where.departmentId = Number(departmentId)
  if (role) where.role = role

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        departmentId: true,
        department: { select: { name: true } },
        disabled: true,
        createdAt: true
      },
      orderBy: { id: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.user.count({ where })
  ])

  return NextResponse.json({ users, total, page, pageSize })
}

export async function PUT(request: NextRequest) {
  const admin = await getSuperAdmin(request)
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

  const { userId, role, departmentId, disabled } = await request.json()
  if (!userId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  if (userId === admin.userId && disabled === true) {
    return NextResponse.json({ error: '不能禁用自己' }, { status: 400 })
  }

  const data: any = {}
  if (role !== undefined) data.role = role
  if (departmentId !== undefined) data.departmentId = departmentId
  if (disabled !== undefined) data.disabled = disabled

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      role: true,
      departmentId: true,
      department: { select: { name: true } },
      disabled: true
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.userId,
      action: 'UPDATE',
      targetType: 'User',
      targetId: userId,
      detail: data
    }
  })

  return NextResponse.json(updated)
}
