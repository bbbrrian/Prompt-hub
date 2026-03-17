'use client'

import { useEffect, useState } from 'react'
import { Empty, Spin, message } from 'antd'
import { HeartFilled } from '@ant-design/icons'
import type { PromptItem } from '@/store/prompt'
import PromptCard from '@/components/ui/PromptCard'
import PromptDetail from '@/components/ui/PromptDetail'

export default function FavoritesPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PromptItem | null>(null)

  useEffect(() => {
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => { setPrompts(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const handleUnfavorite = async (promptId: number) => {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptId }),
    })
    setPrompts(prev => prev.filter(p => p.id !== promptId))
    message.success('已取消收藏')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HeartFilled className="text-red-400 text-xl" />
        <h2 className="text-2xl font-bold neon-text">我的收藏</h2>
        <span className="text-gray-500 text-sm">({prompts.length})</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : prompts.length === 0 ? (
        <Empty description="还没有收藏任何 Prompt" className="py-20" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {prompts.map(p => (
            <div key={p.id} className="relative group">
              <PromptCard item={p} onClick={() => setSelected(p)} keyword="" />
              <button
                onClick={() => handleUnfavorite(p.id)}
                className="absolute top-3 right-10 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all z-10"
                title="取消收藏"
              >
                <HeartFilled />
              </button>
            </div>
          ))}
        </div>
      )}

      <PromptDetail item={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
