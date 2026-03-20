'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Pagination, message, Popconfirm, Empty, Spin, Modal, Tag, Select } from 'antd'
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

interface AgentItem {
  id: number
  name: string
  description: string
  author: string | null
  model: string | null
  version: number
  createdAt: string
  tags: { tag: { id: number; name: string; color: string } }[]
}

interface AgentDetail extends AgentItem {
  systemPrompt: string
  tools: any
}

const DIVISION_TAGS = ['工程','设计','营销','销售','产品','项目管理','测试','支持','游戏开发','专业化','空间计算','学术']

export default function AgentsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AgentItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('工程')
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<AgentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '12' })
      if (search) params.set('search', search)
      if (tagFilter) params.set('tag', tagFilter)
      const res = await fetch(`/api/agents?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
        setTotal(data.total)
      }
    } catch (e: any) {
      message.error(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, search, tagFilter])

  useEffect(() => { load() }, [load])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleTagFilter = (value: string) => {
    setTagFilter(value)
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      message.success('已删除')
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      message.error(err.error || '删除失败')
    }
  }

  const handleViewDetail = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDetailLoading(true)
    setDetail(null)
    const res = await fetch(`/api/agents/${id}`)
    if (res.ok) {
      setDetail(await res.json())
    } else {
      message.error('加载失败')
    }
    setDetailLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold neon-text">Agent 库</h1>
        <button className="neon-button !px-3 !py-1.5 !text-sm" onClick={() => router.push('/agents/new')}>
          <PlusOutlined className="mr-1" />新建
        </button>
      </div>

      <div className="flex gap-3">
        <Input.Search
          placeholder="搜索名称、描述或作者..."
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          className="max-w-md"
        />
        <Select
          allowClear
          value={tagFilter || undefined}
          placeholder="按分类筛选"
          options={DIVISION_TAGS.map(t => ({ value: t, label: t }))}
          onChange={v => handleTagFilter(v ?? '')}
          className="w-36"
        />
      </div>

      <Spin spinning={loading}>
        {items.length === 0 && !loading ? (
          <Empty description="暂无 Agent" className="py-16" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div
                key={item.id}
                className="glass-card p-5 space-y-3 group cursor-pointer hover:border-cyan-500/30 transition-colors"
                onClick={e => handleViewDetail(item.id, e)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold text-gray-100 truncate flex-1 mr-2 font-mono">{item.name}</h3>
                  <span className="badge shrink-0">v{item.version}</span>
                </div>

                <p className="text-sm text-gray-400 line-clamp-2">{item.description || '无描述'}</p>

                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(({ tag }) => (
                      <Tag key={tag.id} color={tag.color} className="!text-xs !py-0 !leading-5 !m-0">{tag.name}</Tag>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {item.author && <span className="text-gray-400">{item.author}</span>}
                    {item.model && <span className="text-cyan-600">{item.model}</span>}
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/10 p-1.5"
                      title="查看"
                      onClick={e => handleViewDetail(item.id, e)}
                    >
                      <EyeOutlined />
                    </button>
                    <button
                      className="text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/10 p-1.5"
                      title="编辑"
                      onClick={e => { e.stopPropagation(); router.push(`/agents/${item.id}/edit`) }}
                    >
                      <EditOutlined />
                    </button>
                    <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)}>
                      <button className="text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/10 p-1.5" title="删除" onClick={e => e.stopPropagation()}>
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>

      {total > 12 && (
        <div className="flex justify-center">
          <Pagination current={page} total={total} pageSize={12} onChange={setPage} showSizeChanger={false} />
        </div>
      )}

      <Modal
        open={!!detail || detailLoading}
        onCancel={() => { setDetail(null); setDetailLoading(false) }}
        footer={null}
        width={800}
        title={detail ? (
          <span className="font-mono text-base">
            {detail.name}
            <span className="text-xs font-normal text-gray-400 ml-2">v{detail.version}</span>
          </span>
        ) : '加载中...'}
      >
        {detailLoading && <div className="py-12 text-center text-gray-400">加载中...</div>}
        {detail && (
          <div className="space-y-5 pt-2">
            {detail.description && (
              <div>
                <div className="text-xs text-gray-400 mb-1">描述</div>
                <p className="text-sm text-gray-200">{detail.description}</p>
              </div>
            )}

            <div className="flex gap-6 text-sm flex-wrap">
              {detail.author && (
                <div>
                  <span className="text-xs text-gray-400 mr-1">作者</span>
                  <span className="text-gray-200">{detail.author}</span>
                </div>
              )}
              {detail.model && (
                <div>
                  <span className="text-xs text-gray-400 mr-1">模型</span>
                  <span className="text-cyan-400">{detail.model}</span>
                </div>
              )}
              {detail.tags?.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 mr-1">标签</span>
                  {detail.tags.map(({ tag }) => (
                    <Tag key={tag.id} color={tag.color} className="!text-xs !py-0 !leading-5 !m-0">{tag.name}</Tag>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2">系统提示词</div>
              <pre className="bg-black/30 rounded-lg p-4 text-xs text-gray-300 font-mono overflow-auto max-h-64 whitespace-pre-wrap">{detail.systemPrompt}</pre>
            </div>

            {detail.tools && (
              <details className="bg-black/20 rounded-lg border border-white/[0.06]">
                <summary className="px-3 py-2 text-xs text-gray-300 cursor-pointer">Tools</summary>
                <pre className="px-3 pb-3 text-xs text-gray-400 font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                  {JSON.stringify(detail.tools, null, 2)}
                </pre>
              </details>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-gray-500">
              <span>创建于 {new Date(detail.createdAt).toLocaleDateString()}</span>
              <button
                className="text-cyan-400 hover:text-cyan-300"
                onClick={() => { setDetail(null); router.push(`/agents/${detail.id}/edit`) }}
              >
                编辑
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
