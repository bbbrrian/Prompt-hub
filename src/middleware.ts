import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_PATHS = new Set(['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/departments'])

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.has(pathname)) {
    const res = NextResponse.next()
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    console.log('[middleware] 无 token，路径:', pathname)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    console.log('[middleware] token 验证失败，路径:', pathname)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }
  console.log('[middleware] token 验证通过，userId:', payload.userId, '路径:', pathname)

  const SUPER_ADMIN_PATHS = ['/admin/users', '/admin/departments', '/api/admin/users', '/api/admin/departments']
  const DEPT_ADMIN_PATHS = ['/admin/dept-users', '/admin/audit-log', '/api/admin/dept-users', '/api/admin/audit-log']
  const ADMIN_BASE = ['/admin', '/api/admin']

  if (SUPER_ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (payload.role !== 'SUPER_ADMIN') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.redirect(new URL('/', req.url))
    }
  } else if (DEPT_ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'DEPT_ADMIN') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.redirect(new URL('/', req.url))
    }
  } else if (ADMIN_BASE.some(p => pathname.startsWith(p))) {
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'DEPT_ADMIN') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', String(payload.userId))
  requestHeaders.set('x-user-role', payload.role)
  requestHeaders.set('x-user-department-id', String(payload.departmentId ?? ''))

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads/).*)'],
}
