'use client'

import { useState, useEffect } from 'react'
import { Input, Button, Select, message } from 'antd'
import { useRouter } from 'next/navigation'

const { TextArea } = Input

interface AgentFormProps {
  isEdit: boolean
  agentId?: number
  initialData?: {
    name: string
    description: string
    systemPrompt: string
    model: string | null
    author: string | null
    tools: any
    tags: { tag: { id: number; name: string; color: string } }[]
  }
}

export default function AgentForm({ isEdit, agentId, initialData }: AgentFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || '')
  const [model, setModel] = useState(initialData?.model || '')
  const [author, setAuthor] = useState(initialData?.author || '')
  const [toolsStr, setToolsStr] = useState(
    initialData?.tools ? JSON.stringify(initialData.tools, null, 2) : ''
  )
  const [tags, setTags] = useState<string[]>(
    initialData?.tags?.map(t => t.tag.name) || []
  )
  const [allTags, setAllTags] = useState<{ value: string; label: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/tags').then(r => r.ok ? r.json() : []).then((data: any[]) => {
      setAllTags(data.map(t => ({ value: t.name, label: t.name })))
    })
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) { message.error('请输入名称'); return }
    if (!description.trim()) { message.error('请输入描述'); return }
    if (!systemPrompt.trim()) { message.error('请输入系统提示词'); return }

    let toolsParsed: any = undefined
    if (toolsStr.trim()) {
      try {
        toolsParsed = JSON.parse(toolsStr)
      } catch {
        message.error('tools 格式不正确，请输入合法的 JSON 数组')
        return
      }
    }

    setSubmitting(true)
    try {
      const url = isEdit ? `/api/agents/${agentId}` : '/api/agents'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          systemPrompt: systemPrompt.trim(),
          model: model.trim() || undefined,
          author: author.trim() || undefined,
          tools: toolsParsed,
          tags,
        }),
      })
      if (res.ok) {
        message.success(isEdit ? '更新成功' : '创建成功')
        router.push('/agents')
      } else {
        const err = await res.json().catch(() => ({}))
        message.error(err.error || '操作失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold neon-text">{isEdit ? '编辑 Agent' : '新建 Agent'}</h1>

      <div className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-1">名称 *</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Agent 名称"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">描述 *</label>
          <TextArea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="简要描述此 Agent 的用途"
            rows={3}
            style={{ resize: 'vertical', minHeight: '2.5rem', maxHeight: '6rem' }}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">系统提示词 *</label>
          <TextArea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            placeholder="输入系统提示词（System Prompt）"
            rows={10}
            style={{ fontFamily: 'monospace', resize: 'vertical', minHeight: '8rem', maxHeight: '30rem' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">模型</label>
            <Input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="gpt-4o"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">作者</label>
            <Input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="作者名称"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Tools（JSON 数组）</label>
          <TextArea
            value={toolsStr}
            onChange={e => setToolsStr(e.target.value)}
            placeholder={`输入 JSON 数组，每个工具包含 name、description 字段\n例：[{"name": "search", "description": "搜索网络"}]`}
            rows={6}
            style={{ fontFamily: 'monospace', resize: 'vertical', minHeight: '4rem', maxHeight: '15rem' }}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">标签</label>
          <Select
            mode="tags"
            value={tags}
            onChange={setTags}
            options={allTags}
            placeholder="选择或创建标签"
            className="w-full"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            className="neon-button border-0"
          >
            {isEdit ? '更新' : '创建'}
          </Button>
          <Button onClick={() => router.push('/agents')} disabled={submitting}>
            取消
          </Button>
        </div>
      </div>
    </div>
  )
}
