import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'prompt-hub-secret-key-change-in-production')
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
