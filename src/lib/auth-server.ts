import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function verifyTokenWithUser(token: string) {
  const payload = await verifyToken(token)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return null
  return { ...payload, role: user.role, departmentId: user.departmentId ?? null }
}
