'use client'

import { useState, useEffect } from 'react'

interface UserItem {
  id: number
  email: string
  role: string
  disabled: boolean
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = { SUPER_ADMIN: '超级管理员', DEPT_ADMIN: '部门管理员', USER: '普通用户' }

export default function DeptUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/dept-users')
        if (!res.ok) throw new Error((await res.json()).error || '加载失败')
        setUsers(await res.json())
      } catch (e: any) {
        setError(e.message)
      }
      setLoading(false)
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">管理后台</a>
        <span className="text-gray-600">/</span>
        <h2 className="text-2xl font-bold neon-text">部门成员</h2>
      </div>

      {error && (
        <div className="glass-card p-4 text-red-400 text-sm border-red-500/30">{error}</div>
      )}

      <div className="glass-card overflow-hidden" style={{ transform: 'none' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="px-4 py-3 text-gray-400 font-medium">邮箱</th>
                <th className="px-4 py-3 text-gray-400 font-medium">角色</th>
                <th className="px-4 py-3 text-gray-400 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-400 font-medium">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-500">
                  <div className="loading-pulse inline-block">加载中...</div>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-500">暂无成员</td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3 text-gray-200">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs border border-white/10 bg-white/5 text-gray-300">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.disabled
                        ? 'border border-red-500/40 text-red-400 bg-red-500/10'
                        : 'border border-green-500/40 text-green-400 bg-green-500/10'
                    }`}>
                      {u.disabled ? '已禁用' : '正常'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
