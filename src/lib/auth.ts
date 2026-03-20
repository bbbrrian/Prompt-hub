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

export { COOKIE_NAME }
