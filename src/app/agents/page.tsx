'use client'

import { useState, useMemo, useEffect } from 'react'
import { Input, Tag, message, Select, Drawer, Button } from 'antd'
import { SearchOutlined, CopyOutlined, RobotOutlined, EditOutlined, CheckOutlined, SaveOutlined } from '@ant-design/icons'
import { AGENTS, DIVISIONS, type Agent } from '@/data/agents'

const { TextArea } = Input
const STORAGE_KEY = 'agent_overrides'

function getOverrides(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveOverride(id: string, prompt: string) {
  const o = getOverrides(); o[id] = prompt; localStorage.setItem(STORAGE_KEY, JSON.stringify(o))
}
function removeOverride(id: string) {
  const o = getOverrides(); delete o[id]; localStorage.setItem(STORAGE_KEY, JSON.stringify(o))
}

const DIVISION_COLORS: Record<string, string> = {
  engineering: '#00ffff',
  design: '#bf00ff',
  marketing: '#ff6b6b',
  sales: '#ffa500',
  product: '#00ff88',
  'project-management': '#0080ff',
  testing: '#ffff00',
  support: '#ff69b4',
  'game-development': '#7fff00',
  specialized: '#ff4500',
  'spatial-computing': '#00bfff',
  academic: '#daa520',
}

export default function AgentsPage() {
  const [search, setSearch] = useState('')
  const [division, setDivision] = useState<string>('all')
  const [selected, setSelected] = useState<Agent | null>(null)
  const [editedPrompt, setEditedPrompt] = useState('')
  const [editing, setEditing] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  useEffect(() => { setOverrides(getOverrides()) }, [])

  const filtered = useMemo(() => {
    return AGENTS.filter(a => {
      const matchDivision = division === 'all' || a.division === division
      const q = search.toLowerCase()
      const matchSearch = !q || a.name.toLowerCase().includes(q) || a.nameZh.includes(q) || a.description.toLowerCase().includes(q) || a.divisionZh.includes(q)
      return matchDivision && matchSearch
    })
  }, [search, division])

  const openAgent = (agent: Agent) => {
    setSelected(agent)
    setEditedPrompt(overrides[agent.id] ?? agent.systemPrompt)
    setEditing(false)
  }

  const handleSave = () => {
    if (!selected) return
    if (editedPrompt === selected.systemPrompt) {
      removeOverride(selected.id)
      setOverrides(o => { const n = { ...o }; delete n[selected.id]; return n })
    } else {
      saveOverride(selected.id, editedPrompt)
      setOverrides(o => ({ ...o, [selected.id]: editedPrompt }))
    }
    setEditing(false)
    message.success('已保存')
  }

  const handleRestore = () => {
    if (!selected) return
    removeOverride(selected.id)
    setOverrides(o => { const n = { ...o }; delete n[selected.id]; return n })
    setEditedPrompt(selected.systemPrompt)
    setEditing(false)
    message.success('已还原')
  }

  const handleCopy = async (prompt: string, name: string) => {
    await navigator.clipboard.writeText(prompt)
    message.success(`已复制 ${name} 的 System Prompt`)
  }

  const color = selected ? DIVISION_COLORS[selected.division] : '#00ffff'
  const isModified = selected ? !!overrides[selected.id] : false

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <RobotOutlined className="text-cyan-400 text-2xl" />
        <h2 className="text-2xl font-bold neon-text">Agent 库</h2>
        <span className="text-gray-500 text-sm">({filtered.length} / {AGENTS.length})</span>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          prefix={<SearchOutlined className="text-gray-500" />}
          placeholder="搜索 Agent..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
          allowClear
        />
        <Select
          value={division}
          onChange={setDivision}
          className="w-40"
          options={[
            { label: '全部分类', value: 'all' },
            ...DIVISIONS.map(d => ({ label: d.nameZh, value: d.id })),
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(agent => (
          <div
            key={agent.id}
            className="glass-card p-4 group hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            style={{ borderColor: overrides[agent.id] ? `${DIVISION_COLORS[agent.division]}55` : `${DIVISION_COLORS[agent.division]}22` }}
            onClick={() => openAgent(agent)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-gray-100 text-sm">{agent.emoji} {agent.nameZh}</div>
                  {overrides[agent.id] && <span className="text-[10px] text-cyan-400 border border-cyan-400/30 rounded px-1">已定制</span>}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{agent.name}</div>
              </div>
              <Tag
                className="!text-xs shrink-0"
                style={{
                  background: `${DIVISION_COLORS[agent.division]}15`,
                  borderColor: `${DIVISION_COLORS[agent.division]}40`,
                  color: DIVISION_COLORS[agent.division],
                }}
              >
                {agent.divisionZh}
              </Tag>
            </div>
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{agent.description}</p>
            <div className="text-xs text-gray-600 font-mono line-clamp-2 bg-white/[0.02] rounded p-2 mb-3">
              {(overrides[agent.id] ?? agent.systemPrompt).slice(0, 120)}...
            </div>
            <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-gray-600">点击查看完整内容</span>
              <button
                onClick={e => { e.stopPropagation(); handleCopy(overrides[agent.id] ?? agent.systemPrompt, agent.name) }}
                className="neon-button !px-3 !py-1 !text-xs"
              >
                <CopyOutlined className="mr-1" />快速复制
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-600">无匹配 Agent</div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        width={640}
        title={null}
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
      >
        {selected && (
          <div className="h-full flex flex-col">
            <div
              className="px-6 py-5 border-b border-white/[0.06]"
              style={{ background: `linear-gradient(135deg, ${color}08, transparent)` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-100">{selected.emoji} {selected.nameZh}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{selected.name} · {selected.divisionZh}</div>
                </div>
                <Tag
                  style={{
                    background: `${color}15`,
                    borderColor: `${color}40`,
                    color,
                  }}
                >
                  {selected.divisionZh}
                </Tag>
              </div>
              <p className="text-sm text-gray-400 mt-3">{selected.description}</p>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Prompt</span>
                <div className="flex items-center gap-3">
                  {isModified && <span className="text-[10px] text-cyan-400 border border-cyan-400/30 rounded px-1.5 py-0.5">已定制</span>}
                  <button
                    onClick={() => setEditing(e => !e)}
                    className="text-xs text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                  >
                    {editing ? <><CheckOutlined />取消</> : <><EditOutlined />编辑</>}
                  </button>
                </div>
              </div>

              {editing ? (
                <TextArea
                  value={editedPrompt}
                  onChange={e => setEditedPrompt(e.target.value)}
                  autoSize={{ minRows: 12, maxRows: 30 }}
                  className="!font-mono !text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: `${color}30` }}
                />
              ) : (
                <pre
                  className="text-sm text-gray-300 whitespace-pre-wrap font-mono rounded-lg p-4 overflow-auto"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {editedPrompt}
                </pre>
              )}
            </div>

            <div
              className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <span className="text-xs text-gray-600">{editedPrompt.length} 字符</span>
              <div className="flex gap-2">
                {isModified && !editing && (
                  <Button size="small" onClick={handleRestore}>还原原版</Button>
                )}
                {editing && (
                  <Button size="small" onClick={handleSave} type="primary" icon={<SaveOutlined />}>保存</Button>
                )}
                <button
                  onClick={() => handleCopy(editedPrompt, selected.name)}
                  className="neon-button !px-4 !py-1.5 !text-sm"
                >
                  <CopyOutlined className="mr-1.5" />复制 System Prompt
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
