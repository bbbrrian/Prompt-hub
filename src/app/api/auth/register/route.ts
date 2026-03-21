import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken, COOKIE_NAME } from '@/lib/auth'

const rateMap = new Map<string, { count: number; resetAt: number }>()
function checkRate(ip: string) {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) { rateMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true }
  if (entry.count >= 5) return false
  entry.count++; return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRate(ip)) return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })

  const body = await req.json()
  const { email, password, departmentId } = body

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: '密码不能少于6位' }, { status: 400 })
  }
  if (!departmentId || typeof departmentId !== 'number') {
    return NextResponse.json({ error: '部门不能为空' }, { status: 400 })
  }

  try {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } })
    if (!dept) {
      return NextResponse.json({ error: '部门不存在' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: '邮箱已注册' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, departmentId },
      select: { id: true, email: true, role: true, departmentId: true },
    })

    const token = await signToken({ userId: user.id, email: user.email, role: user.role, departmentId: user.departmentId })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
