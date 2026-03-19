'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Tag, message, Input, Tabs, Timeline, Button, Popconfirm, Spin, Select, InputNumber } from 'antd'
import { CopyOutlined, EditOutlined, HistoryOutlined, RollbackOutlined, ExportOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import type { PromptItem, PromptVariable } from '@/store/prompt'
import { usePromptStore } from '@/store/prompt'

interface VersionItem {
  id: number
  version: number
  title: string
  content: string
  description: string | null
  author: string | null
  createdAt: string
}

interface Props {
  item: PromptItem | null
  open: boolean
  onClose: () => void
}

interface ParsedPrompt {
  title: string
  description: string
  content: string
}

export default function PromptDetail({ item, open, onClose }: Props) {
  const router = useRouter()
  const { copyPrompt } = usePromptStore()
  const [varModalOpen, setVarModalOpen] = useState(false)
  const [varValues, setVarValues] = useState<Record<string, string>>({})
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [activeTab, setActiveTab] = useState('content')
  const [isFavorited, setIsFavorited] = useState(false)

  const [optimizeOpen, setOptimizeOpen] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeRaw, setOptimizeRaw] = useState('')
  const [optimizeParsed, setOptimizeParsed] = useState<ParsedPrompt | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const variables: PromptVariable[] = (item?.variables as PromptVariable[] | null) || []
  const hasVars = variables.length > 0

  useEffect(() => {
    if (open && item) {
      setActiveTab('content')
      setVersions([])
      fetch(`/api/favorites/check?ids=${item.id}`)
        .then(r => r.json())
        .then(data => setIsFavorited(!!data[item.id]))
        .catch(() => {})
    }
  }, [open, item?.id])

  const handleToggleFavorite = async () => {
    if (!item) return
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId: item.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setIsFavorited(data.favorited)
      message.success(data.favorited ? '已收藏' : '已取消收藏')
    }
  }

  const loadVersions = async () => {
    if (!item) return
    const res = await fetch(`/api/prompts/${item.id}/versions`)
    if (res.ok) setVersions(await res.json())
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    if (key === 'history' && versions.length === 0) loadVersions()
  }

  const handleCopyClick = () => {
    if (hasVars) {
      const defaults: Record<string, string> = {}
      variables.forEach(v => { defaults[v.name] = v.defaultValue || '' })
      setVarValues(defaults)
      setVarModalOpen(true)
    } else {
      doCopy(item!.content)
    }
  }

  const handleVarCopy = () => {
    for (const v of variables) {
      if (v.required && !varValues[v.name]?.trim()) {
        message.error(`请填写必填变量: ${v.label}`)
        return
      }
    }
    let result = item!.content
    for (const [name, value] of Object.entries(varValues)) {
      result = result.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), value)
    }
    doCopy(result)
    setVarModalOpen(false)
  }

  const doCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    await copyPrompt(item!.id)
    message.success('已复制到剪贴板')
  }

  const handleRollback = async (versionId: number) => {
    const res = await fetch(`/api/prompts/${item!.id}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    })
    if (res.ok) {
      message.success('已回滚')
      onClose()
    }
  }

  const handleOptimizeOpen = async () => {
    setOptimizeOpen(true)
    setOptimizing(true)
    setOptimizeRaw('')
    setOptimizeParsed(null)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/optimize-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item!.title,
          content: item!.content,
          description: item!.description || '',
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }))
        message.error(err.error || '优化失败')
        setOptimizing(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const json = JSON.parse(data)
              const delta = json.choices?.[0]?.delta?.content || ''
              if (delta) {
                fullText += delta
                setOptimizeRaw(fullText)
              }
            } catch {}
          }
        }
      }

      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/)
        if (jsonMatch) setOptimizeParsed(JSON.parse(jsonMatch[0]))
      } catch {}
    } catch (e: any) {
      if (e.name !== 'AbortError') message.error(e.message || '网络错误')
    }

    setOptimizing(false)
  }

  const handleOptimizeClose = () => {
    abortRef.current?.abort()
    setOptimizeOpen(false)
  }

  const handleConfirmOptimize = () => {
    if (!optimizeParsed) return
    const prefill = encodeURIComponent(JSON.stringify(optimizeParsed))
    router.push(`/prompts/${item!.id}/edit?prefill=${prefill}`)
    setOptimizeOpen(false)
    onClose()
  }

  if (!item) return null

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        title={null}
        footer={null}
        width={720}
        className="prompt-detail-modal"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-gray-100">{item.title}</h2>
            <span className="text-sm text-gray-500">v{item.version}</span>
          </div>

          {item.description && (
            <p className="text-gray-400">{item.description}</p>
          )}

          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={[
              {
                key: 'content',
                label: '内容',
                children: (
                  <div className="relative">
                    <pre className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 pr-36 text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-[400px]">
                      {item.content}
                    </pre>
                    <button
                      onClick={handleCopyClick}
                      className="absolute top-3 right-3 neon-button !px-3 !py-1 !text-xs"
                    >
                      <CopyOutlined className="mr-1" />{hasVars ? '填写变量并复制' : '复制'}
                    </button>
                  </div>
                ),
              },
              {
                key: 'history',
                label: <span><HistoryOutlined className="mr-1" />版本历史</span>,
                children: versions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无历史版本</p>
                ) : (
                  <div className="max-h-[400px] overflow-auto">
                    <Timeline
                      items={versions.map(v => ({
                        children: (
                          <div className="glass-card p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-200 font-medium">v{v.version} - {v.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</span>
                                <Popconfirm title="确定回滚到此版本？" onConfirm={() => handleRollback(v.id)}>
                                  <Button size="small" type="link" icon={<RollbackOutlined />}>回滚</Button>
                                </Popconfirm>
                              </div>
                            </div>
                            <pre className="text-xs text-gray-400 whitespace-pre-wrap line-clamp-4 font-mono">{v.content}</pre>
                          </div>
                        ),
                      }))}
                    />
                  </div>
                ),
              },
            ]}
          />

          <div className="flex flex-wrap gap-1">
            {item.categories.map(({ category }) => (
              <Tag key={category.id} color="blue">
                {category.dimension?.name}/{category.name}
              </Tag>
            ))}
            {item.tags.map(({ tag }) => (
              <Tag key={tag.id} color={tag.color}>
                {tag.name}
              </Tag>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {item.author && <span>作者: {item.author}</span>}
              <span>{new Date(item.createdAt).toLocaleString()}</span>
              <span>复制 {item.copyCount} 次</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`!px-3 !py-1 !text-xs transition-colors ${isFavorited ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-red-400'}`}
                onClick={handleToggleFavorite}
                title={isFavorited ? '取消收藏' : '收藏'}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {isFavorited ? <HeartFilled /> : <HeartOutlined />}
              </button>
              <a
                href={`/prompts/${item.id}/skill-builder`}
                className="neon-button !px-3 !py-1 !text-xs"
              >
                <ExportOutlined className="mr-1" />生成 Skill
              </a>
              <button
                className="neon-button !px-3 !py-1 !text-xs"
                onClick={handleOptimizeOpen}
              >
                ✨ AI 优化
              </button>
              <a href={`/prompts/${item.id}/edit`} className="neon-button !px-3 !py-1 !text-xs">
                <EditOutlined className="mr-1" />编辑
              </a>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={varModalOpen}
        onCancel={() => setVarModalOpen(false)}
        title="填写模板变量"
        onOk={handleVarCopy}
        okText="替换并复制"
        width={480}
      >
        <div className="space-y-3 py-2">
          {variables.map(v => (
            <div key={v.name}>
              <label className="block text-sm text-gray-400 mb-1">
                {v.label}{v.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {v.type === 'enum' && v.enumOptions?.length ? (
                <Select
                  value={varValues[v.name] || undefined}
                  onChange={val => setVarValues(prev => ({ ...prev, [v.name]: val }))}
                  placeholder={v.defaultValue || `请选择 ${v.label}`}
                  className="w-full"
                  options={v.enumOptions.map(o => ({ label: o, value: o }))}
                  allowClear
                />
              ) : v.type === 'number' ? (
                <InputNumber
                  value={varValues[v.name] ? Number(varValues[v.name]) : undefined}
                  onChange={val => setVarValues(prev => ({ ...prev, [v.name]: String(val ?? '') }))}
                  placeholder={v.defaultValue || `请输入 ${v.label}`}
                  className="w-full"
                />
              ) : (
                <Input
                  value={varValues[v.name] || ''}
                  onChange={e => setVarValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                  placeholder={v.defaultValue || `请输入 ${v.label}`}
                />
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={optimizeOpen}
        onCancel={handleOptimizeClose}
        title="AI 优化"
        footer={null}
        width={680}
      >
        <div className="space-y-4 py-2">
          {optimizing && (
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <Spin size="small" />
              <span>正在优化中...</span>
            </div>
          )}

          {optimizeRaw && (
            <pre className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-64">
              {optimizeRaw}
            </pre>
          )}

          {optimizeParsed && !optimizing && (
            <div className="space-y-3">
              <div className="glass-card p-4 space-y-2">
                <h3 className="font-semibold text-gray-200">{optimizeParsed.title}</h3>
                {optimizeParsed.description && (
                  <p className="text-sm text-gray-400">{optimizeParsed.description}</p>
                )}
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-white/[0.02] rounded p-3 max-h-48 overflow-auto">
                  {optimizeParsed.content}
                </pre>
              </div>
              <div className="flex justify-end">
                <button className="neon-button" onClick={handleConfirmOptimize}>
                  确认优化
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </>
  )
}
