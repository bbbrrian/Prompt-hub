'use client'

import { useState, useEffect } from 'react'

interface Dept {
  id: number
  name: string
  parentId: number | null
  children: Dept[]
  _count: { users: number }
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Dept[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addParentId, setAddParentId] = useState<string>('')
  const [addLoading, setAddLoading] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const fetchDepts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/departments')
      if (!res.ok) throw new Error((await res.json()).error || '加载失败')
      setDepartments(await res.json())
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { fetchDepts() }, [])

  const handleAdd = async () => {
    if (!addName.trim()) return
    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim(), parentId: addParentId ? Number(addParentId) : null })
      })
      if (!res.ok) {
        showToast((await res.json()).error || '创建失败')
      } else {
        showToast('部门已创建')
        setAddName('')
        setAddParentId('')
        setShowAdd(false)
        fetchDepts()
      }
    } catch {
      showToast('请求失败')
    }
    setAddLoading(false)
  }

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })
      if (!res.ok) {
        showToast((await res.json()).error || '修改失败')
      } else {
        showToast('已更新')
        setEditId(null)
        fetchDepts()
      }
    } catch {
      showToast('请求失败')
    }
    setEditLoading(false)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除部门「${name}」？`)) return
    try {
      const res = await fetch(`/api/admin/departments/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast((await res.json()).error || '删除失败')
      } else {
        showToast('已删除')
        fetchDepts()
      }
    } catch {
      showToast('请求失败')
    }
  }

  const topLevel = departments.filter(d => !d.parentId)
  const getChildren = (parentId: number) => departments.filter(d => d.parentId === parentId)

  const renderDept = (dept: Dept, level: number) => (
    <div key={dept.id}>
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors`}
        style={{ paddingLeft: `${16 + level * 28}px` }}
      >
        {level > 0 && <span className="text-gray-600 text-xs">└</span>}
        {editId === dept.id ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              className="search-input !py-1.5 max-w-[200px]"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEdit(dept.id)}
              autoFocus
            />
            <button className="neon-button !px-3 !py-1.5 text-xs" onClick={() => handleEdit(dept.id)} disabled={editLoading}>
              保存
            </button>
            <button className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1" onClick={() => setEditId(null)}>
              取消
            </button>
          </div>
        ) : (
          <>
            <span className="text-gray-200 flex-1">{dept.name}</span>
            <span className="text-xs text-gray-500">{dept._count.users} 人</span>
            <button
              className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 transition-colors"
              onClick={() => { setEditId(dept.id); setEditName(dept.name) }}
            >
              编辑
            </button>
            <button
              className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 transition-colors"
              onClick={() => handleDelete(dept.id, dept.name)}
            >
              删除
            </button>
          </>
        )}
      </div>
      {getChildren(dept.id).map(child => renderDept(child, level + 1))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">管理后台</a>
        <span className="text-gray-600">/</span>
        <h2 className="text-2xl font-bold neon-text">部门管理</h2>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2 rounded-lg text-sm font-medium border border-neon-cyan/40 bg-[rgba(10,10,30,0.9)] text-gray-200 animate-fadeIn">
          {toast}
        </div>
      )}

      {error && (
        <div className="glass-card p-4 text-red-400 text-sm border-red-500/30">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button className="neon-button" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '取消' : '+ 新增部门'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card p-4 flex flex-wrap items-end gap-3" style={{ transform: 'none' }}>
          <div>
            <label className="block text-xs text-gray-400 mb-1">部门名称</label>
            <input
              className="search-input max-w-[200px]"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="输入部门名称"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">父部门（可选）</label>
            <select
              className="search-input max-w-[200px]"
              value={addParentId}
              onChange={e => setAddParentId(e.target.value)}
            >
              <option value="">无（顶级部门）</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button className="neon-button" onClick={handleAdd} disabled={addLoading}>
            {addLoading ? '创建中...' : '创建'}
          </button>
        </div>
      )}

      <div className="glass-card overflow-hidden" style={{ transform: 'none' }}>
        {loading ? (
          <div className="px-4 py-16 text-center text-gray-500">
            <div className="loading-pulse inline-block">加载中...</div>
          </div>
        ) : topLevel.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-500">暂无部门</div>
        ) : (
          topLevel.map(dept => renderDept(dept, 0))
        )}
      </div>
    </div>
  )
}
