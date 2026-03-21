'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Tag, message } from 'antd'
import { SearchOutlined, CopyOutlined, CloseOutlined } from '@ant-design/icons'

interface SearchResult {
  id: number
  title: string
  content: string
  description: string | null
  copyCount: number
  tags: { tag: { name: string; color: string } }[]
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelectedIdx(0)
    }
  }, [open])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&pageSize=8`)
    if (res.ok) {
      const data = await res.json()
      setResults(data.items || [])
      setSelectedIdx(0)
    }
    setLoading(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(q), 300)
  }

  const handleCopy = async (item: SearchResult) => {
    await navigator.clipboard.writeText(item.content)
    await fetch(`/api/prompts/${item.id}/copy`, { method: 'PATCH' })
    message.success('已复制到剪贴板')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIdx]) handleCopy(results[selectedIdx])
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(10,10,30,0.97)', border: '1px solid rgba(30,80,174,0.2)', boxShadow: '0 0 60px rgba(30,80,174,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <SearchOutlined className="text-cyan-400 text-lg flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="搜索 Prompt... (Enter 复制，↑↓ 导航)"
            className="flex-1 bg-transparent outline-none text-gray-200 placeholder-gray-600 text-base"
          />
          <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
            <CloseOutlined />
          </button>
        </div>

        {loading && (
          <div className="px-5 py-3 text-sm text-gray-600">搜索中...</div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-600">无匹配结果</div>
        )}

        {results.length > 0 && (
          <div className="max-h-[400px] overflow-auto">
            {results.map((item, idx) => (
              <div
                key={item.id}
                className="px-5 py-3 cursor-pointer group transition-colors"
                style={{ background: idx === selectedIdx ? 'rgba(30,80,174,0.06)' : 'transparent' }}
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={() => handleCopy(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 mb-1">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mb-1 line-clamp-1">{item.description}</div>
                    )}
                    <div className="text-xs text-gray-600 line-clamp-2 font-mono">{item.content.slice(0, 120)}{item.content.length > 120 ? '...' : ''}</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.tags.slice(0, 3).map(({ tag }) => (
                        <Tag key={tag.name} color={tag.color} className="!text-xs !px-1.5 !py-0">{tag.name}</Tag>
                      ))}
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 neon-button !px-2.5 !py-1 !text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => { e.stopPropagation(); handleCopy(item) }}
                  >
                    <CopyOutlined className="mr-1" />复制
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-2.5 border-t border-white/[0.04] flex items-center gap-4 text-xs text-gray-700">
          <span>↑↓ 导航</span>
          <span>Enter 复制</span>
          <span>Esc 关闭</span>
          <span className="ml-auto">Ctrl+K / ⌘K 唤起</span>
        </div>
      </div>
    </div>
  )
}
