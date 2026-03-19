'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { AGENTS } from '@/data/agents'

const NeuralNetworkBg = dynamic(() => import('@/components/three/NeuralNetworkBg'), { ssr: false })

const AGENT_COUNT = AGENTS.length

interface QuickStats {
  totalPrompts: number
  totalSkills: number
  totalCopies: number
  totalCategories: number
  totalTags: number
  topPrompts: { title: string; copyCount: number }[]
  recentPrompts: { title: string; author: string; createdAt: string }[]
}

const features = [
  { icon: '📝', title: 'Prompt 模板库', desc: '结构化管理团队 Prompt 资产，按维度分类检索', href: '/prompts' },
  { icon: '📊', title: '数据看板', desc: '实时统计使用数据，量化 AI 辅助效果', href: '/dashboard' },
  { icon: '📖', title: 'AI 入门指南', desc: '全员必读，从认知统一到进阶技巧', href: '/guide' },
  { icon: '🏷️', title: '分类管理', desc: '多维度 + 树形分类，灵活组织知识体系', href: '/categories' },
]

export default function Home() {
  const [stats, setStats] = useState<QuickStats | null>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  return (
    <div className="-mt-4">
      <section className="relative flex flex-col items-center justify-center min-h-[50vh] text-center overflow-hidden">
        <NeuralNetworkBg />
        <div className="animate-fadeIn relative z-10 mt-16">
          <div className="flex justify-center mb-5">
            <span className="text-5xl">⚡</span>
          </div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight neon-text">Prompt Hub</h2>
          <p className="text-gray-300 text-lg font-medium mb-2">AI 提示词共享平台</p>
          <p className="text-gray-600 text-xs mb-10 tracking-widest">规范驱动 · 模板沉淀 · 效果可量化</p>
          <div className="flex gap-4 justify-center">
            <a href="/prompts" className="neon-button text-base px-8 py-3">浏览 Prompt 库</a>
            <a href="/prompts/new" className="neon-button text-base px-8 py-3" style={{ borderColor: 'rgba(63, 35, 180, 0.4)', color: '#9b8de8' }}>
              创建新 Prompt
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-16 w-full max-w-5xl animate-slideUp relative z-10">
          {[
            { label: 'Prompt 总数', value: stats?.totalPrompts ?? '—', color: '#7ba8e8', href: '/prompts' },
            { label: 'Skill 数量', value: stats?.totalSkills ?? '—', color: '#5bc8a0', href: '/skills' },
            { label: '使用次数', value: stats?.totalCopies ?? '—', color: '#9b8de8', href: '/dashboard' },
            { label: '分类数', value: stats?.totalCategories ?? '—', color: '#5b9bd5', href: '/categories' },
            { label: '标签数', value: stats?.totalTags ?? '—', color: '#FFA727', href: '/prompts' },
            { label: 'Agent 数', value: AGENT_COUNT, color: '#e87b7b', href: '/agents' },
          ].map((s) => (
            <a key={s.label} href={s.href} className="text-center py-4 glass-card hover:scale-105 transition-transform block">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-16 mb-12">
        <h3 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">平台功能</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <a
              key={f.title}
              href={f.href}
              className="glass-card p-6 group cursor-pointer block feature-card"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#7ba8e8' }}>{f.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {stats && stats.topPrompts.length > 0 && (
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
              <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-cyan-400 rounded-full inline-block" />
                热门 Prompt
              </h3>
              <div className="space-y-2">
                {stats.topPrompts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: i < 3 ? ['rgba(0,255,255,0.15)', 'rgba(191,0,255,0.15)', 'rgba(0,128,255,0.15)'][i] : 'rgba(255,255,255,0.04)',
                          color: i < 3 ? ['#00ffff', '#bf00ff', '#0080ff'][i] : '#555',
                          border: `1px solid ${i < 3 ? ['rgba(0,255,255,0.3)', 'rgba(191,0,255,0.3)', 'rgba(0,128,255,0.3)'][i] : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: i < 3 ? `0 0 8px ${['rgba(0,255,255,0.2)', 'rgba(191,0,255,0.2)', 'rgba(0,128,255,0.2)'][i]}` : 'none',
                        }}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-300 truncate">{p.title}</span>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">{p.copyCount} 次</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 animate-slideUp" style={{ animationDelay: '300ms' }}>
              <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-400 rounded-full inline-block" />
                最新添加
              </h3>
              <div className="space-y-2">
                {stats.recentPrompts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 pulse-dot shrink-0" />
                      <span className="text-sm text-gray-300">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{p.author}</span>
                      <span>{new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mb-8 text-center">
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-blue-500/5" />
          <div className="relative z-10">
            <p className="text-gray-400 text-sm mb-4">基于《公司 AI 工程化应用框架》建设</p>
            <p className="text-xs text-gray-600">认知统一 → 规范学习 → 模板应用 → 实战开发 → 效果评估 → 模板优化</p>
          </div>
        </div>
      </section>
    </div>
  )
}
