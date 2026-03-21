'use client'

import { useState, useEffect, useCallback } from 'react'

interface LogItem {
  id: number
  userId: number
  user: { email: string }
  action: string
  targetType: string
  targetId: number
  detail: any
  createdAt: string
}

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE'] as const
const TARGET_TYPES = ['Prompt', 'Skill', 'Agent', 'Workflow', 'User', 'Department'] as const
const PAGE_SIZE = 20

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    if (action) params.set('action', action)
    if (targetType) params.set('targetType', targetType)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    try {
      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (!res.ok) throw new Error((await res.json()).error || '加载失败')
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [page, action, targetType, startDate, endDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const actionColor = (a: string) => {
    if (a === 'CREATE') return 'text-green-400 bg-green-500/10 border-green-500/30'
    if (a === 'DELETE') return 'text-red-400 bg-red-500/10 border-red-500/30'
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">管理后台</a>
        <span className="text-gray-600">/</span>
        <h2 className="text-2xl font-bold neon-text">审计日志</h2>
      </div>

      {error && (
        <div className="glass-card p-4 text-red-400 text-sm border-red-500/30">{error}</div>
      )}

      <div className="glass-card p-4 flex flex-wrap items-center gap-3" style={{ transform: 'none' }}>
        <select
          className="search-input max-w-[150px]"
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1) }}
        >
          <option value="">全部操作</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          className="search-input max-w-[150px]"
          value={targetType}
          onChange={e => { setTargetType(e.target.value); setPage(1) }}
        >
          <option value="">全部类型</option>
          {TARGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="date"
          className="search-input max-w-[160px]"
          value={startDate}
          onChange={e => { setStartDate(e.target.value); setPage(1) }}
        />
        <span className="text-gray-500 text-sm">至</span>
        <input
          type="date"
          className="search-input max-w-[160px]"
          value={endDate}
          onChange={e => { setEndDate(e.target.value); setPage(1) }}
        />
        <span className="text-sm text-gray-500 ml-auto">共 {total} 条</span>
      </div>

      <div className="glass-card overflow-hidden" style={{ transform: 'none' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="px-4 py-3 text-gray-400 font-medium w-8"></th>
                <th className="px-4 py-3 text-gray-400 font-medium">操作人</th>
                <th className="px-4 py-3 text-gray-400 font-medium">操作</th>
                <th className="px-4 py-3 text-gray-400 font-medium">目标类型</th>
                <th className="px-4 py-3 text-gray-400 font-medium">目标ID</th>
                <th className="px-4 py-3 text-gray-400 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-500">
                  <div className="loading-pulse inline-block">加载中...</div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-500">暂无日志</td></tr>
              ) : logs.map((log, i) => (
                <>
                  <tr
                    key={log.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 text-gray-500">
                      <span className={`inline-block transition-transform ${expandedId === log.id ? 'rotate-90' : ''}`}>
                        &#9656;
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-200">{log.user?.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{log.targetType}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.targetId}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-detail`} className="bg-white/[0.015]">
                      <td colSpan={6} className="px-8 py-3">
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap break-all font-mono bg-black/20 rounded-lg p-3 border border-white/5">
                          {JSON.stringify(log.detail, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
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
