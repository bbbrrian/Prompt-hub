import { SignJWT, jwtVerify } from 'jose'

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

export { COOKIE_NAME }
