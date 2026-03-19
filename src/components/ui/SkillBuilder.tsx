'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Input, Button, message, Upload, Tree, Select } from 'antd'
import { PlusOutlined, DeleteOutlined, DownloadOutlined, BookOutlined, RobotOutlined, FileOutlined, FolderOutlined, SaveOutlined } from '@ant-design/icons'
import type { PromptItem } from '@/store/prompt'
import JSZip from 'jszip'

const { TextArea } = Input

function toSkillName(title: string) {
  return title
    .toLowerCase()
    .replace(/[\s\u4e00-\u9fa5]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'skill'
}

interface ReferenceItem {
  id: string
  name: string
  content: string
}

interface ScriptItem {
  id: string
  name: string
  content: string
}

interface AssetItem {
  id: string
  name: string
  file?: File
  storedPath?: string
}

interface Props {
  prompt?: PromptItem | null
  skillId?: number | null
}

export default function SkillBuilder({ prompt, skillId }: Props) {
  const [editingSkillId, setEditingSkillId] = useState<number | null>(skillId ?? null)
  const [skillName, setSkillName] = useState(prompt ? toSkillName(prompt.title) : '')
  const [description, setDescription] = useState(prompt?.description || '')
  const [author, setAuthor] = useState(prompt?.author || '')
  const [tags, setTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<{ value: string; label: string }[]>([])
  const [promptContent, setPromptContent] = useState(prompt?.content || '')
  const [references, setReferences] = useState<ReferenceItem[]>([])
  const [scripts, setScripts] = useState<ScriptItem[]>([])
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetch('/api/tags').then(r => r.ok ? r.json() : []).then((data: any[]) => {
      setAllTags(data.map(t => ({ value: t.name, label: t.name })))
    })
  }, [])

  useEffect(() => {
    if (!skillId) return
    fetch(`/api/skills/${skillId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setSkillName(data.name)
        setDescription(data.description || '')
        setAuthor(data.author || '')
        setTags(data.tags?.map((t: any) => t.tag.name) || [])
        setPromptContent(data.content)
        if (data.references) {
          setReferences(data.references.map((r: any) => ({ id: crypto.randomUUID(), name: r.filename, content: r.content })))
        }
        if (data.scripts) {
          setScripts(data.scripts.map((s: any) => ({ id: crypto.randomUUID(), name: s.filename, content: s.content })))
        }
        if (data.assets) {
          setAssets(data.assets.map((a: any) => ({ id: crypto.randomUUID(), name: a.filename, storedPath: a.storedPath })))
        }
      })
  }, [])

  const addReference = () => {
    setReferences(prev => [...prev, { id: crypto.randomUUID(), name: `reference-${prev.length + 1}.md`, content: '' }])
  }

  const updateReference = (id: string, field: 'name' | 'content', value: string) => {
    setReferences(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const removeReference = (id: string) => {
    setReferences(prev => prev.filter(r => r.id !== id))
  }

  const addScript = () => {
    setScripts(prev => [...prev, { id: crypto.randomUUID(), name: `script-${prev.length + 1}.sh`, content: '#!/bin/bash\n' }])
  }

  const updateScript = (id: string, field: 'name' | 'content', value: string) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const removeScript = (id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id))
  }

  const addAsset = (file: File) => {
    setAssets(prev => [...prev, { id: crypto.randomUUID(), name: file.name, file, storedPath: undefined }])
    return false
  }

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id))
  }

  const handleAiDescription = async () => {
    setAiLoading(true)
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/suggest-skill-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: promptContent, title: prompt?.title || skillName }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }))
        message.error(err.error || '生成失败')
        setAiLoading(false)
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
                setDescription(fullText)
              }
            } catch {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') message.error(e.message || '网络错误')
    }
    setAiLoading(false)
  }

  const treeData = useMemo(() => {
    const children: any[] = [
      { title: 'SKILL.md', key: 'skill.md', icon: <FileOutlined />, isLeaf: true },
    ]
    if (references.length > 0) {
      children.push({
        title: 'references',
        key: 'references',
        icon: <FolderOutlined />,
        children: references.map(r => ({
          title: r.name,
          key: `ref-${r.id}`,
          icon: <FileOutlined />,
          isLeaf: true,
        })),
      })
    }
    if (scripts.length > 0) {
      children.push({
        title: 'scripts',
        key: 'scripts',
        icon: <FolderOutlined />,
        children: scripts.map(s => ({
          title: s.name,
          key: `script-${s.id}`,
          icon: <FileOutlined />,
          isLeaf: true,
        })),
      })
    }
    if (assets.length > 0) {
      children.push({
        title: 'assets',
        key: 'assets',
        icon: <FolderOutlined />,
        children: assets.map(a => ({
          title: a.name,
          key: `asset-${a.id}`,
          icon: <FileOutlined />,
          isLeaf: true,
        })),
      })
    }
    return [{
      title: skillName || 'skill',
      key: 'root',
      icon: <FolderOutlined />,
      children,
    }]
  }, [skillName, references, scripts, assets])

  const handleSave = async () => {
    if (!skillName.trim()) { message.error('请填写 Skill 名称'); return }
    if (!promptContent.trim()) { message.error('请填写 Prompt 内容'); return }

    setSaving(true)

    // 上传本地文件（还没有 storedPath 的）
    const uploadedAssets = await Promise.all(assets.map(async a => {
      if (a.storedPath) return { filename: a.name, storedPath: a.storedPath }
      if (!a.file) return null
      const form = new FormData()
      form.append('file', a.file)
      if (editingSkillId) form.append('skillId', String(editingSkillId))
      const r = await fetch('/api/skills/upload-asset', { method: 'POST', body: form })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        message.error(`文件 ${a.name} 上传失败: ${err.error || '未知错误'}`)
        return null
      }
      const d = await r.json()
      return { filename: d.filename, storedPath: d.storedPath }
    }))

    const payload: any = {
      name: skillName,
      description,
      author,
      tags,
      content: promptContent,
      references: references.map(r => ({ filename: r.name, content: r.content })),
      scripts: scripts.map(s => {
        const ext = s.name.split('.').pop() || 'sh'
        const langMap: Record<string, string> = { sh: 'sh', py: 'py', js: 'js', ts: 'ts' }
        return { filename: s.name, language: langMap[ext] || 'sh', content: s.content }
      }),
      assets: uploadedAssets.filter(Boolean),
      promptId: prompt?.id ?? undefined,
    }

    const url = editingSkillId ? `/api/skills/${editingSkillId}` : '/api/skills'
    const method = editingSkillId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      setEditingSkillId(data.id)
      if (data.assets) {
        setAssets(data.assets.map((a: any) => ({ id: crypto.randomUUID(), name: a.filename, storedPath: a.storedPath })))
      }
      message.success(editingSkillId ? '已更新' : '已保存到库')
    } else {
      const err = await res.json().catch(() => ({}))
      message.error(err.error || '保存失败')
    }
    setSaving(false)
  }

  const handleDownload = async () => {
    if (!skillName.trim()) {
      message.error('请填写 Skill 名称')
      return
    }
    if (!promptContent.trim()) {
      message.error('请填写 Prompt 内容')
      return
    }

    const cats = prompt?.categories?.map((c: any) => `${c.category.dimension?.name}/${c.category.name}`).join(', ') || ''
    const tagStr = tags.length > 0 ? tags.join(', ') : (prompt?.tags?.map((t: any) => t.tag.name).join(', ') || '')

    const skillMd = [
      '---',
      `name: ${skillName}`,
      `description: ${description || prompt?.title || skillName}`,
      cats ? `categories: ${cats}` : null,
      tagStr ? `tags: ${tagStr}` : null,
      (author || prompt?.author) ? `author: ${author || prompt?.author}` : null,
      '---',
      '',
      promptContent,
    ].filter(line => line !== null).join('\n')

    const zip = new JSZip()
    const folder = zip.folder(skillName)!

    folder.file('SKILL.md', skillMd)

    if (references.length > 0) {
      const refFolder = folder.folder('references')!
      references.forEach(r => refFolder.file(r.name, r.content))
    }

    if (scripts.length > 0) {
      const scriptFolder = folder.folder('scripts')!
      scripts.forEach(s => scriptFolder.file(s.name, s.content))
    }

    if (assets.length > 0) {
      const assetFolder = folder.folder('assets')!
      for (const a of assets) {
        const buf = await a.file.arrayBuffer()
        assetFolder.file(a.name, buf)
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${skillName}.zip`
    link.click()
    URL.revokeObjectURL(url)
    message.success('Skill 包已下载')
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold neon-text">Skill Builder</h1>
        <div className="flex gap-2">
          <a href="/skill-guide" className="neon-button !px-3 !py-1.5 !text-sm inline-flex items-center">
            <BookOutlined className="mr-1" />查看指南
          </a>
          <button className="neon-button !px-4 !py-1.5 !text-sm" onClick={handleSave} disabled={saving}>
            <SaveOutlined className="mr-1" />{saving ? '保存中...' : (editingSkillId ? '更新到库' : '保存到库')}
          </button>
          <button className="neon-button !px-4 !py-1.5 !text-sm" onClick={handleDownload}>
            <DownloadOutlined className="mr-1" />下载 ZIP
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <section className="glass-card p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-200">基础信息</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Skill Name</label>
              <Input
                value={skillName}
                onChange={e => setSkillName(e.target.value)}
                placeholder="my-skill"
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Description
                <button
                  className="ml-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={handleAiDescription}
                  disabled={aiLoading}
                >
                  <RobotOutlined className="mr-0.5" />
                  {aiLoading ? '生成中...' : 'AI 生成'}
                </button>
              </label>
              <TextArea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="描述触发条件，例如：当用户需要生成 AFSIM 仿真脚本时使用"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">作者</label>
                <Input
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="作者名"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">标签</label>
                <Select
                  mode="tags"
                  value={tags}
                  onChange={setTags}
                  options={allTags}
                  placeholder="输入或选择标签"
                  className="w-full"
                />
              </div>
            </div>
          </section>

          <section className="glass-card p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-200">Prompt 内容</h2>
            <TextArea
              value={promptContent}
              onChange={e => setPromptContent(e.target.value)}
              autoSize={{ minRows: 8, maxRows: 20 }}
              className="font-mono !text-sm"
            />
          </section>

          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-200">References</h2>
              <Button size="small" icon={<PlusOutlined />} onClick={addReference}>添加</Button>
            </div>
            {references.map(r => (
              <div key={r.id} className="space-y-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Input
                    value={r.name}
                    onChange={e => updateReference(r.id, 'name', e.target.value)}
                    placeholder="文件名"
                    size="small"
                    className="font-mono flex-1"
                  />
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeReference(r.id)} />
                </div>
                <TextArea
                  value={r.content}
                  onChange={e => updateReference(r.id, 'content', e.target.value)}
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  placeholder="参考内容..."
                  className="font-mono !text-xs"
                />
              </div>
            ))}
            {references.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">暂无参考文件，点击添加</p>
            )}
          </section>

          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-200">Scripts</h2>
              <Button size="small" icon={<PlusOutlined />} onClick={addScript}>添加</Button>
            </div>
            {scripts.map(s => (
              <div key={s.id} className="space-y-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Input
                    value={s.name}
                    onChange={e => updateScript(s.id, 'name', e.target.value)}
                    placeholder="脚本文件名 (如 setup.sh)"
                    size="small"
                    className="font-mono flex-1"
                  />
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeScript(s.id)} />
                </div>
                <TextArea
                  value={s.content}
                  onChange={e => updateScript(s.id, 'content', e.target.value)}
                  autoSize={{ minRows: 4, maxRows: 12 }}
                  placeholder="脚本内容..."
                  className="font-mono !text-xs"
                />
              </div>
            ))}
            {scripts.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">暂无脚本，点击添加</p>
            )}
          </section>

          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-200">Assets</h2>
              <Upload beforeUpload={addAsset} showUploadList={false}>
                <Button size="small" icon={<PlusOutlined />}>上传文件</Button>
              </Upload>
            </div>
            {assets.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <FileOutlined />
                  <span className="font-mono">{a.name}</span>
                  {a.file && <span className="text-gray-500 text-xs">({(a.file.size / 1024).toFixed(1)} KB)</span>}
                  {a.storedPath && !a.file && <span className="text-green-500 text-xs">已上传</span>}
                </div>
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeAsset(a.id)} />
              </div>
            ))}
            {assets.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">暂无附件，点击上传</p>
            )}
          </section>
        </div>

        <div className="w-64 shrink-0 hidden lg:block">
          <div className="glass-card p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">目录预览</h3>
            <Tree
              treeData={treeData}
              defaultExpandAll
              showIcon
              selectable={false}
              className="text-sm"
            />
          </div>
        </div>
      </div>

    </div>
  )
}
