'use client'

import { useState, useEffect, useCallback } from 'react'

interface Dept {
  id: number
  name: string
  parentId: number | null
}

interface UserItem {
  id: number
  email: string
  role: string
  departmentId: number | null
  department: { name: string } | null
  disabled: boolean
  createdAt: string
}

const ROLES = ['SUPER_ADMIN', 'DEPT_ADMIN', 'USER'] as const
const ROLE_LABELS: Record<string, string> = { SUPER_ADMIN: '超级管理员', DEPT_ADMIN: '部门管理员', USER: '普通用户' }
const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [departments, setDepartments] = useState<Dept[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const fetchDepts = async () => {
    const res = await fetch('/api/departments')
    if (res.ok) setDepartments(await res.json())
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (filterDept) params.set('departmentId', filterDept)
    if (filterRole) params.set('role', filterRole)
    try {
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error((await res.json()).error || '加载失败')
      const data = await res.json()
      setUsers(data.users)
      setTotal(data.total)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [page, search, filterDept, filterRole])

  useEffect(() => { fetchDepts() }, [])
  useEffect(() => { fetchUsers() }, [fetchUsers])

  const updateUser = async (userId: number, payload: any) => {
    setSaving(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...payload })
      })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || '操作失败')
        return
      }
      showToast('已更新')
      fetchUsers()
    } catch {
      showToast('请求失败')
    }
    setSaving(null)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">管理后台</a>
        <span className="text-gray-600">/</span>
        <h2 className="text-2xl font-bold neon-text">用户管理</h2>
      </div>

      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <input
          className="search-input max-w-xs"
          placeholder="搜索邮箱..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="search-input max-w-[180px]"
          value={filterDept}
          onChange={e => { setFilterDept(e.target.value); setPage(1) }}
        >
          <option value="">全部部门</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select
          className="search-input max-w-[180px]"
          value={filterRole}
          onChange={e => { setFilterRole(e.target.value); setPage(1) }}
        >
          <option value="">全部角色</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">共 {total} 位用户</span>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2 rounded-lg text-sm font-medium border border-neon-cyan/40 bg-[rgba(10,10,30,0.9)] text-gray-200 animate-fadeIn">
          {toast}
        </div>
      )}

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
                <th className="px-4 py-3 text-gray-400 font-medium">部门</th>
                <th className="px-4 py-3 text-gray-400 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-400 font-medium">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-500">
                  <div className="loading-pulse inline-block">加载中...</div>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-500">暂无数据</td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3 text-gray-200">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="search-input !py-1.5 !px-2 text-xs max-w-[140px]"
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={e => updateUser(u.id, { role: e.target.value })}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="search-input !py-1.5 !px-2 text-xs max-w-[140px]"
                      value={u.departmentId ?? ''}
                      disabled={saving === u.id}
                      onChange={e => updateUser(u.id, { departmentId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">无部门</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        u.disabled
                          ? 'border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20'
                          : 'border-green-500/40 text-green-400 bg-green-500/10 hover:bg-green-500/20'
                      }`}
                      disabled={saving === u.id}
                      onClick={() => updateUser(u.id, { disabled: !u.disabled })}
                    >
                      {u.disabled ? '已禁用' : '已启用'}
                    </button>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="neon-button !px-3 !py-1.5 text-sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一页
          </button>
          <span className="text-sm text-gray-400 px-3">{page} / {totalPages}</span>
          <button
            className="neon-button !px-3 !py-1.5 text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
