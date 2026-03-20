import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'ph_token'

function getSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET 环境变量未配置')
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

export async function signToken(payload: { userId: number; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { userId: number; email: string; role: string }
  } catch {
    return null
  }
}

export async function verifyTokenWithUser(token: string) {
  const payload = await verifyToken(token)
  if (!payload) return null
  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return null
  if (user.role !== payload.role) return null
  return payload
}

export { COOKIE_NAME }
