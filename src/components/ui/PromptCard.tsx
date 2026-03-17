'use client'

import { Tag, Tooltip, message } from 'antd'
import { CopyOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { PromptItem } from '@/store/prompt'
import { usePromptStore } from '@/store/prompt'

function Highlight({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return <>{parts.map((p, i) => p.toLowerCase() === keyword.toLowerCase() ? <mark key={i}>{p}</mark> : p)}</>
}

interface Props {
  item: PromptItem
  onView: (item: PromptItem) => void
}

export default function PromptCard({ item, onView }: Props) {
  const { copyPrompt, deletePrompt, keyword } = usePromptStore()

  const hasVars = Array.isArray(item.variables) && item.variables.length > 0

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasVars) {
      onView(item)
      return
    }
    await navigator.clipboard.writeText(item.content)
    await copyPrompt(item.id)
    message.success('已复制到剪贴板')
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deletePrompt(item.id)
    message.success('已删除')
  }

  return (
    <div className="glass-card p-5 cursor-pointer group" onClick={() => onView(item)}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-100 truncate flex-1 mr-2"><Highlight text={item.title} keyword={keyword} /></h3>
        <span className="badge shrink-0">v{item.version}</span>
      </div>

      {item.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2"><Highlight text={item.description!} keyword={keyword} /></p>
      )}

      <p className="text-sm text-gray-500 mb-4 line-clamp-3 font-mono bg-white/[0.02] rounded-r p-2 border-l-2"
        style={{ borderLeftColor: 'rgba(0,255,255,0.2)' }}>
        <Highlight text={item.content} keyword={keyword} />
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {item.categories.map(({ category }) => (
          <Tag key={category.id} color="blue" className="!text-xs !m-0">
            {category.dimension?.name}/{category.name}
          </Tag>
        ))}
        {item.categories.length > 0 && item.tags.length > 0 && (
          <span className="w-px h-4 self-center mx-0.5" style={{ background: 'rgba(255,255,255,0.1)' }} />
        )}
        {item.tags.map(({ tag }) => (
          <Tag key={tag.id} color={tag.color} className="!text-xs !m-0">
            {tag.name}
          </Tag>
        ))}
      </div>

      <div className="relative pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {item.author && <span>{item.author}</span>}
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="absolute right-0 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip title="查看">
            <button onClick={(e) => { e.stopPropagation(); onView(item) }} className="text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/10 p-1.5">
              <EyeOutlined />
            </button>
          </Tooltip>
          <Tooltip title="复制">
            <button onClick={handleCopy} className="text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/10 p-1.5">
              <CopyOutlined />
            </button>
          </Tooltip>
          <Tooltip title="编辑">
            <a href={`/prompts/${item.id}/edit`} onClick={(e) => e.stopPropagation()} className="text-gray-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-white/10 p-1.5 inline-flex">
              <EditOutlined />
            </a>
          </Tooltip>
          <Tooltip title="删除">
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-white/10 p-1.5">
              <DeleteOutlined />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
