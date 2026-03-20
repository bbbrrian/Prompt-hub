'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input, Pagination, message, Popconfirm, Upload, Empty, Spin, Dropdown, Modal, Tag, Select } from 'antd'
import { SearchOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, UploadOutlined, PlusOutlined, FileTextOutlined, EditFilled, EyeOutlined, FileOutlined, CodeOutlined, BookOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

interface SkillItem {
  id: number
  name: string
  description: string
  author: string | null
  version: number
  downloadCount: number
  createdAt: string
  prompt: { id: number; title: string } | null
  user: { id: number; email: string } | null
  tags: { tag: { id: number; name: string; color: string } }[]
}

interface SkillDetail extends SkillItem {
  content: string
  references: { filename: string; content: string }[] | null
  scripts: { filename: string; language: string; content: string }[] | null
  assets: { filename: string; storedPath: string }[] | null
}

export default function SkillsPage() {
  const router = useRouter()
  const [items, setItems] = useState<SkillItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [allTags, setAllTags] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [detail, setDetail] = useState<SkillDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [promptSearch, setPromptSearch] = useState('')
  const [promptList, setPromptList] = useState<{ id: number; title: string; description: string }[]>([])
  const [promptLoading, setPromptLoading] = useState(false)
  const promptSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchPrompts = useCallback(async (q: string) => {
    setPromptLoading(true)
    const params = new URLSearchParams({ pageSize: '20' })
    if (q) params.set('search', q)
    const res = await fetch(`/api/prompts?${params}`)
    if (res.ok) {
      const data = await res.json()
      setPromptList(data.items.map((p: any) => ({ id: p.id, title: p.title, description: p.description })))
    }
    setPromptLoading(false)
  }, [])

  useEffect(() => {
    if (!promptModalOpen) return
    searchPrompts('')
  }, [promptModalOpen, searchPrompts])

  const handlePromptSearchChange = (val: string) => {
    setPromptSearch(val)
    if (promptSearchTimer.current) clearTimeout(promptSearchTimer.current)
    promptSearchTimer.current = setTimeout(() => searchPrompts(val), 300)
  }

  useEffect(() => {
    fetch('/api/tags').then(r => r.ok ? r.json() : []).then((data: any[]) => {
      setAllTags(data.map(t => ({ value: t.name, label: t.name })))
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '12' })
    if (search) params.set('search', search)
    if (tagFilter) params.set('tag', tagFilter)
    const res = await fetch(`/api/skills?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    }
    setLoading(false)
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
    const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' })
    if (res.ok) {
      message.success('已删除')
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      message.error(err.error || '删除失败')
    }
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/skills/import', { method: 'POST', body: form })
    if (res.ok) {
      message.success('导入成功')
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      message.error(err.error || '导入失败')
    }
    setImporting(false)
    return false
  }

  const handleViewDetail = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDetailLoading(true)
    setDetail(null)
    const res = await fetch(`/api/skills/${id}`)
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
        <h1 className="text-2xl font-bold neon-text">Skill 库</h1>
        <div className="flex gap-2">
          <a href="/skill-guide" className="neon-button !px-3 !py-1.5 !text-sm inline-flex items-center">
            <BookOutlined className="mr-1" />查看指南
          </a>
          <Upload beforeUpload={handleImport as any} showUploadList={false} accept=".zip,.md" disabled={importing}>
            <button className="neon-button !px-3 !py-1.5 !text-sm" disabled={importing}>
              <UploadOutlined className="mr-1" />{importing ? '导入中...' : '导入'}
            </button>
          </Upload>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'blank',
                  icon: <EditFilled />,
                  label: <a href="/skills/new">直接新建</a>,
                },
                {
                  key: 'from-prompt',
                  icon: <FileTextOutlined />,
                  label: <span onClick={() => setPromptModalOpen(true)}>从 Prompt 创建</span>,
                },
              ],
            }}
            placement="bottomRight"
          >
            <button className="neon-button !px-3 !py-1.5 !text-sm">
              <PlusOutlined className="mr-1" />新建
            </button>
          </Dropdown>
        </div>
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
          placeholder="按标签筛选"
          options={allTags}
          onChange={handleTagFilter}
          className="w-40"
        />
      </div>

      <Spin spinning={loading}>
        {items.length === 0 && !loading ? (
          <Empty description="暂无 Skill" className="py-16" />
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
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>↓{item.downloadCount}</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/10 p-1.5"
                      title="查看"
                      onClick={e => handleViewDetail(item.id, e)}
                    >
                      <EyeOutlined />
                    </button>
                    <a
                      href={item.prompt ? `/prompts/${item.prompt.id}/skill-builder?skillId=${item.id}` : `/skills/${item.id}/edit`}
                      className="text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/10 p-1.5 inline-flex"
                      title="编辑"
                      onClick={e => e.stopPropagation()}
                    >
                      <EditOutlined />
                    </a>
                    <a
                      href={`/api/skills/${item.id}/download`}
                      className="text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/10 p-1.5 inline-flex"
                      title="下载"
                      onClick={e => e.stopPropagation()}
                    >
                      <DownloadOutlined />
                    </a>
                    <div onClick={e => e.stopPropagation()}>
                    <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)}>
                      <button className="text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/10 p-1.5" title="删除">
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                    </div>
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
        open={promptModalOpen}
        onCancel={() => { setPromptModalOpen(false); setPromptSearch(''); setPromptList([]) }}
        footer={null}
        title="选择 Prompt"
        width={600}
      >
        <Input
          placeholder="搜索 Prompt..."
          prefix={<SearchOutlined />}
          value={promptSearch}
          onChange={e => handlePromptSearchChange(e.target.value)}
          allowClear
          className="mb-3"
        />
        <Spin spinning={promptLoading}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {promptList.length === 0 && !promptLoading && (
              <Empty description="暂无结果" className="py-8" />
            )}
            {promptList.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-white/10 cursor-pointer hover:border-cyan-500/40 hover:bg-white/5 transition-colors"
                onClick={() => {
                  setPromptModalOpen(false)
                  router.push(`/skills/new?promptId=${p.id}`)
                }}
              >
                <div className="text-sm font-medium text-gray-100">{p.title}</div>
                {p.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.description}</div>}
              </div>
            ))}
          </div>
        </Spin>
      </Modal>

      <Modal
        open={!!detail || detailLoading}
        onCancel={() => { setDetail(null); setDetailLoading(false) }}
        footer={null}
        width={800}
        title={detail ? <span className="font-mono text-base">{detail.name} <span className="text-xs font-normal text-gray-400 ml-2">v{detail.version}</span></span> : '加载中...'}
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

            <div className="flex gap-6 text-sm">
              {detail.author && (
                <div>
                  <span className="text-xs text-gray-400 mr-1">作者</span>
                  <span className="text-gray-200">{detail.author}</span>
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
              <div className="text-xs text-gray-400 mb-2">Prompt 内容</div>
              <pre className="bg-black/30 rounded-lg p-4 text-xs text-gray-300 font-mono overflow-auto max-h-64 whitespace-pre-wrap">{detail.content}</pre>
            </div>

            {detail.references && detail.references.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-2">References ({detail.references.length})</div>
                <div className="space-y-2">
                  {detail.references.map((r, i) => (
                    <details key={i} className="bg-black/20 rounded-lg border border-white/[0.06]">
                      <summary className="px-3 py-2 text-xs text-gray-300 cursor-pointer flex items-center gap-2">
                        <FileOutlined />{r.filename}
                      </summary>
                      <pre className="px-3 pb-3 text-xs text-gray-400 font-mono overflow-auto max-h-40 whitespace-pre-wrap">{r.content}</pre>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {detail.scripts && detail.scripts.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-2">Scripts ({detail.scripts.length})</div>
                <div className="space-y-2">
                  {detail.scripts.map((s, i) => (
                    <details key={i} className="bg-black/20 rounded-lg border border-white/[0.06]">
                      <summary className="px-3 py-2 text-xs text-gray-300 cursor-pointer flex items-center gap-2">
                        <CodeOutlined />{s.filename}
                        {s.language && <Tag className="!text-xs !py-0 !leading-4">{s.language}</Tag>}
                      </summary>
                      <pre className="px-3 pb-3 text-xs text-gray-400 font-mono overflow-auto max-h-40 whitespace-pre-wrap">{s.content}</pre>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {detail.assets && detail.assets.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-2">Assets ({detail.assets.length})</div>
                <div className="flex flex-wrap gap-2">
                  {detail.assets.map((a, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-gray-300 bg-black/20 rounded px-2 py-1 border border-white/[0.06]">
                      <FileOutlined />{a.filename}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-gray-500">
              <div className="flex gap-4">
                <span>创建于 {new Date(detail.createdAt).toLocaleDateString()}</span>
                <span>下载 {detail.downloadCount} 次</span>
                {detail.prompt && <span>来源：<a href={`/prompts/${detail.prompt.id}/skill-builder`} className="text-cyan-400">{detail.prompt.title}</a></span>}
              </div>
              <div className="flex gap-2">
                <a
                  href={detail.prompt ? `/prompts/${detail.prompt.id}/skill-builder?skillId=${detail.id}` : `/skills/${detail.id}/edit`}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  编辑
                </a>
                <a href={`/api/skills/${detail.id}/download`} className="text-cyan-400 hover:text-cyan-300">下载</a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
