'use client'

import { useEffect, useState, useMemo } from 'react'
import { Input, Select, Button, message, TreeSelect, Switch, Table, InputNumber } from 'antd'
import { useRouter } from 'next/navigation'
import type { Dimension, Tag, PromptVariable } from '@/store/prompt'

const { TextArea } = Input

interface FormData {
  title: string
  content: string
  description: string
  author: string
  categoryIds: number[]
  tagIds: number[]
  variables: PromptVariable[]
  visibility: 'PUBLIC' | 'DEPARTMENT' | 'PRIVATE'
  department: string
}

interface Props {
  initialData?: FormData & { id?: number }
  isEdit?: boolean
}

export default function PromptForm({ initialData, isEdit }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    title: '',
    content: '',
    description: '',
    author: '',
    categoryIds: [],
    tagIds: [],
    variables: [],
    visibility: 'PUBLIC',
    department: '',
  })
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [tagOptions, setTagOptions] = useState<{ label: string; value: string | number }[]>([])

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setDimensions)
    fetch('/api/tags').then(r => r.json()).then((data: Tag[]) => {
      setTags(data)
      setTagOptions(data.map(t => ({ label: t.name, value: t.id })))
    })
  }, [])

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        content: initialData.content,
        description: initialData.description || '',
        author: initialData.author || '',
        categoryIds: initialData.categoryIds,
        tagIds: initialData.tagIds,
        variables: initialData.variables || [],
        visibility: (initialData as any).visibility || 'PUBLIC',
        department: (initialData as any).department || '',
      })
    }
  }, [initialData])

  const detectedVars = useMemo(() => {
    const matches = form.content.match(/\{\{(\w+)\}\}/g) || []
    return Array.from(new Set(matches.map(m => m.slice(2, -2))))
  }, [form.content])

  useEffect(() => {
    if (detectedVars.length === 0) {
      if (form.variables.length > 0) set('variables', [])
      return
    }
    const updated = detectedVars.map(name => {
      const existing = form.variables.find(v => v.name === name)
      return existing || { name, label: name, type: 'text' as const, defaultValue: '', required: false }
    })
    const changed = updated.length !== form.variables.length ||
      updated.some((v, i) => v.name !== form.variables[i]?.name)
    if (changed) set('variables', updated)
  }, [detectedVars])

  const treeData = dimensions.map((dim) => ({
    title: dim.name,
    value: `dim-${dim.id}`,
    selectable: false,
    children: dim.categories
      .filter(c => !c.parentId)
      .map(cat => ({
        title: cat.name,
        value: cat.id,
        children: dim.categories
          .filter(c => c.parentId === cat.id)
          .map(sub => ({ title: sub.name, value: sub.id })),
      })),
  }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      message.error('标题和内容不能为空')
      return
    }
    setSubmitting(true)

    const resolvedTagIds: number[] = []
    for (const val of form.tagIds) {
      if (typeof val === 'number') {
        resolvedTagIds.push(val)
      } else {
        const existing = tags.find(t => t.name === val)
        if (existing) {
          resolvedTagIds.push(existing.id)
        } else {
          const res = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: val }),
          })
          const newTag = await res.json()
          resolvedTagIds.push(newTag.id)
          setTags(prev => [...prev, newTag])
          setTagOptions(prev => [...prev, { label: newTag.name, value: newTag.id }])
        }
      }
    }

    const url = isEdit ? `/api/prompts/${initialData?.id}` : '/api/prompts'
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tagIds: resolvedTagIds }),
    })
    setSubmitting(false)
    if (res.ok) {
      message.success(isEdit ? '更新成功' : '创建成功')
      router.push('/prompts')
    } else {
      message.error('操作失败')
    }
  }

  const set = (key: keyof FormData, val: any) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <label className="block text-sm text-gray-400 mb-1">标题 *</label>
        <Input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Prompt 标题"
          size="large"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">内容 *</label>
        <TextArea
          value={form.content}
          onChange={e => set('content', e.target.value)}
          placeholder="输入 Prompt 内容..."
          autoSize={{ minRows: 8, maxRows: 20 }}
          className="!font-mono"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">描述</label>
        <TextArea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="简要描述这个 Prompt 的用途"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">作者</label>
          <Input
            value={form.author}
            onChange={e => set('author', e.target.value)}
            placeholder="你的名字"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">分类</label>
          <TreeSelect
            treeData={treeData}
            value={form.categoryIds}
            onChange={val => set('categoryIds', val)}
            treeCheckable
            placeholder="选择分类"
            className="w-full"
            allowClear
          />
        </div>
      </div>

      {form.variables.length > 0 && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">模板变量 (检测到 {'{{变量名}}'} 格式)</label>
          <Table
            dataSource={form.variables}
            rowKey="name"
            pagination={false}
            size="small"
            columns={[
              { title: '变量名', dataIndex: 'name', width: 100 },
              {
                title: '类型', dataIndex: 'type', width: 90,
                render: (_: any, record: PromptVariable, idx: number) => (
                  <Select
                    size="small"
                    value={record.type || 'text'}
                    onChange={val => {
                      const vars = [...form.variables]
                      vars[idx] = { ...vars[idx], type: val }
                      set('variables', vars)
                    }}
                    options={[
                      { label: '文本', value: 'text' },
                      { label: '枚举', value: 'enum' },
                      { label: '数字', value: 'number' },
                    ]}
                    className="w-full"
                  />
                ),
              },
              {
                title: '显示标签', dataIndex: 'label', width: 120,
                render: (_: any, record: PromptVariable, idx: number) => (
                  <Input
                    size="small"
                    value={record.label}
                    onChange={e => {
                      const vars = [...form.variables]
                      vars[idx] = { ...vars[idx], label: e.target.value }
                      set('variables', vars)
                    }}
                  />
                ),
              },
              {
                title: '枚举选项', dataIndex: 'enumOptions', width: 160,
                render: (_: any, record: PromptVariable, idx: number) => (
                  record.type === 'enum' ? (
                    <Select
                      size="small"
                      mode="tags"
                      value={record.enumOptions || []}
                      onChange={val => {
                        const vars = [...form.variables]
                        vars[idx] = { ...vars[idx], enumOptions: val }
                        set('variables', vars)
                      }}
                      placeholder="输入选项回车确认"
                      className="w-full"
                      tokenSeparators={[',']}
                    />
                  ) : <span className="text-gray-600 text-xs">—</span>
                ),
              },
              {
                title: '默认值', dataIndex: 'defaultValue', width: 120,
                render: (_: any, record: PromptVariable, idx: number) => (
                  <Input
                    size="small"
                    value={record.defaultValue}
                    onChange={e => {
                      const vars = [...form.variables]
                      vars[idx] = { ...vars[idx], defaultValue: e.target.value }
                      set('variables', vars)
                    }}
                  />
                ),
              },
              {
                title: '必填', dataIndex: 'required', width: 60, align: 'center' as const,
                render: (_: any, record: PromptVariable, idx: number) => (
                  <Switch
                    size="small"
                    checked={record.required}
                    onChange={val => {
                      const vars = [...form.variables]
                      vars[idx] = { ...vars[idx], required: val }
                      set('variables', vars)
                    }}
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">可见性</label>
          <Select
            value={form.visibility}
            onChange={val => set('visibility', val)}
            className="w-full"
            options={[
              { label: '公开', value: 'PUBLIC' },
              { label: '部门可见', value: 'DEPARTMENT' },
              { label: '私有', value: 'PRIVATE' },
            ]}
          />
        </div>
        {form.visibility === 'DEPARTMENT' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">部门</label>
            <Input
              value={form.department}
              onChange={e => set('department', e.target.value)}
              placeholder="所属部门"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">标签</label>
        <Select
          mode="tags"
          value={form.tagIds}
          onChange={val => set('tagIds', val)}
          placeholder="选择或输入新标签"
          className="w-full"
          allowClear
          options={tagOptions}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="primary" size="large" loading={submitting} onClick={handleSubmit}>
          {isEdit ? '更新' : '创建'}
        </Button>
        <Button size="large" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </div>
  )
}
