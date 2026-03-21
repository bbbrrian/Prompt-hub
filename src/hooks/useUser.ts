'use client'
import { useState, useEffect } from 'react'

type User = {
  userId: number
  email: string
  role: 'SUPER_ADMIN' | 'DEPT_ADMIN' | 'USER'
  departmentId: number | null
  departmentName: string | null
}

let cachedUser: User | null = null
let fetchPromise: Promise<User | null> | null = null

export function useUser() {
  const [user, setUser] = useState<User | null>(cachedUser)

  useEffect(() => {
    if (cachedUser) {
      setUser(cachedUser)
      return
    }
    if (!fetchPromise) {
      fetchPromise = fetch('/api/auth/me')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          cachedUser = data
          return data
        })
        .catch(() => null)
    }
    fetchPromise.then(setUser)
  }, [])

  return user
}

export function canModifyResource(user: User | null, resource: { userId?: number | null }): boolean {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true
  if (!resource.userId) return false
  return user.userId === resource.userId
}

export function clearUserCache() {
  cachedUser = null
  fetchPromise = null
}
