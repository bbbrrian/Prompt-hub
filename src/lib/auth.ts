import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET 环境变量未配置')
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE_NAME = 'ph_token'

export async function signToken(payload: { userId: number; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { userId: number; email: string; role: string }
  } catch {
    return null
  }
}

export async function verifyTokenWithUser(token: string) {
  const payload = await verifyToken(token)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return null
  return payload
}

export { COOKIE_NAME }
