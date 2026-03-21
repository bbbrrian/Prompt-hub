import { prisma } from './prisma'

export type UserPayload = {
  userId: number
  email: string
  role: 'SUPER_ADMIN' | 'DEPT_ADMIN' | 'USER'
  departmentId: number | null
}

export function canModify(user: UserPayload, resource: { userId?: number | null }): boolean {
  if (user.role === 'SUPER_ADMIN') return true
  if (!resource.userId) return false
  return user.userId === resource.userId
}

export function isAdmin(user: UserPayload): boolean {
  return user.role === 'SUPER_ADMIN'
}

export function isDeptAdmin(user: UserPayload): boolean {
  return user.role === 'DEPT_ADMIN' || user.role === 'SUPER_ADMIN'
}

export async function writeAuditLog(
  userId: number,
  action: string,
  targetType: string,
  targetId: number,
  detail?: any
) {
  await prisma.auditLog.create({
    data: { userId, action, targetType, targetId, detail: detail ?? undefined }
  })
}
