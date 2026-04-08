'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Modal, Select, Empty, Spin, message, Popconfirm, Drawer, Tag, Alert } from 'antd'
import { DeleteOutlined, PlusOutlined, ExportOutlined, EditOutlined } from '@ant-design/icons'
import { useWorkflowStore } from '@/store/workflow'
import type { Workflow } from '@/store/workflow'
import { useUser, canModifyResource } from '@/hooks/useUser'
import BorderGlow from '@/components/ui/BorderGlow'

const { TextArea } = Input

interface StepDraft {
  promptId: number | null
  inputMapping: Record<string, string>
}

interface PromptOption {
  id: number
  title: string
}

export default function WorkflowsPage() {
  const { workflows, loading, fetchWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } = useWorkflowStore()
  const currentUser = useUser()
  const [prompts, setPrompts] = useState<PromptOption[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<StepDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [skillGuideOpen, setSkillGuideOpen] = useState(false)
  const [skillGuideUrl, setSkillGuideUrl] = useState('')
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [viewWorkflow, setViewWorkflow] = useState<Workflow | null>(null)

  useEffect(() => {
    fetchWorkflows()
    fetch('/api/prompts?pageSize=1000').then(r => r.json()).then(d => setPrompts(d.items?.map((p: any) => ({ id: p.id, title: p.title })) || []))
  }, [fetchWorkflows])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setSteps([{ promptId: null, inputMapping: {} }])
    setModalOpen(true)
  }

  const openEdit = (w: Workflow) => {
    setEditing(w)
    setName(w.name)
    setDescription(w.description || '')
    setSteps(w.steps.map(s => ({ promptId: s.promptId, inputMapping: (s.inputMapping as Record<string, string>) || {} })))
    setModalOpen(true)
  }

  const addStep = () => setSteps([...steps, { promptId: null, inputMapping: {} }])

  const removeStep = (idx: number) => setSteps(steps.filter((_, i) => i !== idx))

  const updateStep = (idx: number, field: keyof StepDraft, val: any) => {
    const next = [...steps]
    next[idx] = { ...next[idx], [field]: val }
    setSteps(next)
  }

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return
    const next = [...steps]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setSteps(next)
  }

  const handleSubmit = async () => {
    if (!name.trim()) { message.error('请输入工作流名称'); return }
    const validSteps = steps.filter(s => s.promptId)
    if (validSteps.length === 0) { message.error('至少添加一个步骤'); return }

    setSubmitting(true)
    const payload = {
      name,
      description: description || undefined,
      steps: validSteps.map((s, i) => ({
        promptId: s.promptId!,
        stepOrder: i,
        inputMapping: Object.keys(s.inputMapping).length > 0 ? s.inputMapping : undefined,
      })),
    }

    if (editing) {
      await updateWorkflow(editing.id, payload)
    } else {
      await createWorkflow(payload)
    }
    setSubmitting(false)
    setModalOpen(false)
    message.success(editing ? '已更新' : '已创建')
  }

  const handleSkillDownload = () => {
    window.location.href = skillGuideUrl
    setSkillGuideOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold neon-text">工作流</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建工作流</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : workflows.length === 0 ? (
        <Empty description="暂无工作流" className="py-20" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows.map(w => (
            <BorderGlow
              key={w.id}
              className="cursor-pointer group"
              onClick={() => { setViewWorkflow(w); setViewDrawerOpen(true) }}
            >
              <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-100 truncate flex-1 mr-2">{w.name}</h3>
                <span className="text-xs text-gray-500">{w.steps.length} 步</span>
              </div>
              {w.description && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{w.description}</p>}
              <div className="space-y-1 mb-3">
                {w.steps.map((s, i) => (
                  <div key={s.id} className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-900/50 text-cyan-400 flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="truncate">{s.prompt?.title || `Prompt #${s.promptId}`}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <span className="text-xs text-gray-500">{new Date(w.updatedAt).toLocaleDateString()}</span>
                {canModifyResource(currentUser, { userId: w.user?.id }) && (
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(w) }}
                      className="text-gray-400 hover:text-cyan-400"
                      title="编辑"
                    >
                      <EditOutlined />
                    </button>
                    <Popconfirm title="确认删除？" onConfirm={(e) => { e?.stopPropagation(); deleteWorkflow(w.id) }} onCancel={(e) => e?.stopPropagation()}>
                      <button onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-red-400">
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                )}
              </div>
              </div>
            </BorderGlow>
          ))}
        </div>
      )}

      <Drawer
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        title={viewWorkflow?.name}
        width={520}
        extra={
          viewWorkflow && (
            <div className="flex items-center gap-2">
              <Button
                icon={<ExportOutlined />}
                onClick={() => {
                  setSkillGuideUrl(`/api/workflows/${viewWorkflow.id}/export-skill`)
                  setSkillGuideOpen(true)
                }}
              >
                导出为 Skill 包
              </Button>
              {canModifyResource(currentUser, { userId: viewWorkflow.user?.id }) && (
                <>
                  <Button
                    onClick={() => {
                      openEdit(viewWorkflow)
                      setViewDrawerOpen(false)
                    }}
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    title="确认删除？"
                    onConfirm={() => {
                      deleteWorkflow(viewWorkflow.id)
                      setViewDrawerOpen(false)
                    }}
                  >
                    <Button danger>删除</Button>
                  </Popconfirm>
                </>
              )}
            </div>
          )
        }
      >
        {viewWorkflow && (
          <div className="space-y-4">
            {viewWorkflow.description && (
              <p className="text-gray-400 text-sm">{viewWorkflow.description}</p>
            )}
            <div className="space-y-3">
              {viewWorkflow.steps.map((s, i) => (
                <div key={s.id} className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-cyan-900/50 text-cyan-400 flex items-center justify-center shrink-0 text-sm font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-200 mb-1">
                        {s.prompt?.title || `Prompt #${s.promptId}`}
                      </div>
                      {s.prompt?.content && (
                        <p className="text-xs text-gray-500 line-clamp-3">
                          {s.prompt.content.slice(0, 150)}{s.prompt.content.length > 150 ? '...' : ''}
                        </p>
                      )}
                      {s.inputMapping && Object.keys(s.inputMapping).length > 0 && (
                        <Tag color="blue" className="mt-2">有输入映射</Tag>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={editing ? '编辑工作流' : '新建工作流'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={700}
        destroyOnClose
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">名称 *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="工作流名称" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">描述</label>
            <TextArea value={description} onChange={e => setDescription(e.target.value)} placeholder="工作流描述" autoSize={{ minRows: 2, maxRows: 4 }} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">步骤</label>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveStep(idx, idx - 1)} disabled={idx === 0} className="text-gray-500 hover:text-cyan-400 disabled:opacity-20 text-xs">▲</button>
                    <button onClick={() => moveStep(idx, idx + 1)} disabled={idx === steps.length - 1} className="text-gray-500 hover:text-cyan-400 disabled:opacity-20 text-xs">▼</button>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-cyan-900/50 text-cyan-400 flex items-center justify-center shrink-0 text-sm">{idx + 1}</span>
                  <Select
                    value={step.promptId}
                    onChange={val => updateStep(idx, 'promptId', val)}
                    placeholder="选择 Prompt"
                    className="flex-1"
                    showSearch
                    optionFilterProp="label"
                    options={prompts.map(p => ({ label: p.title, value: p.id }))}
                    allowClear
                  />
                  <div className="flex flex-col w-48">
                    <Input
                      placeholder="输入映射 JSON (可选)"
                      value={JSON.stringify(step.inputMapping) === '{}' ? '' : JSON.stringify(step.inputMapping)}
                      onChange={e => {
                        try {
                          const val = e.target.value.trim() ? JSON.parse(e.target.value) : {}
                          updateStep(idx, 'inputMapping', val)
                        } catch {}
                      }}
                    />
                    {idx > 0 && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        可用: {Array.from({length: idx}, (_, i) => `{{step${i+1}.output}}`).join(', ')}
                      </div>
                    )}
                  </div>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(idx)} className="text-gray-400 hover:text-red-400"><DeleteOutlined /></button>
                  )}
                </div>
              ))}
            </div>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addStep} className="mt-2 w-full">添加步骤</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={skillGuideOpen}
        onCancel={() => setSkillGuideOpen(false)}
        title="安装 Skill 指南"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSkillGuideOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSkillDownload}>立即下载</Button>
          </div>
        }
        width={520}
      >
        <div className="space-y-4 py-2">
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>解压下载的 zip 文件到任意目录</li>
            <li>确认文件夹内包含 SKILL.md 文件</li>
            <li>将文件夹复制到 ~/.claude/skills/ 目录下</li>
            <li>或在 ~/.claude/settings.json 的 skillsDirectories 中添加路径</li>
            <li>重启 Claude Code 即可使用 /skill-name 调用</li>
          </ol>
          <Alert
            type="warning"
            message="建议单次安装不超过 16 个 Skill，过多会导致模型质量下降"
          />
        </div>
      </Modal>
    </div>
  )
}
