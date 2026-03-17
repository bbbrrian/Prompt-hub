'use client'

import { useState, useEffect, useRef } from 'react'

interface Stats {
  totalPrompts: number
  totalCopies: number
  totalCategories: number
  totalTags: number
  promptsByDimension: { name: string; value: number }[]
  topPrompts: { title: string; copyCount: number }[]
  recentPrompts: { title: string; author: string; createdAt: string }[]
  tagDistribution: { name: string; value: number }[]
  copyTrend: { date: string; count: number }[]
  categoryCopyStats: { name: string; copyCount: number }[]
  tagCopyStats: { name: string; copyCount: number }[]
}

function AnimatedCounter({ target, duration = 2000, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (target === 0) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function NeonBarChart({ data, color, maxVal }: { data: { label: string; value: number }[]; color: string; maxVal: number }) {
  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0
        return (
          <div key={i} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 truncate max-w-[200px]" title={item.label}>
                {item.label}
              </span>
              <span className="text-xs font-mono ml-2" style={{ color }}>{item.value}</span>
            </div>
            <div className="w-full h-6 rounded-md overflow-hidden relative"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div
                className="h-full rounded-md transition-all duration-1000 ease-out relative overflow-hidden"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}22, ${color}88)`,
                  animationDelay: `${i * 80}ms`,
                  boxShadow: `0 0 12px ${color}33`,
                }}
              >
                <div className="absolute inset-0 opacity-30"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                    animation: 'shimmer 2s ease-in-out infinite',
                    animationDelay: `${i * 200}ms`,
                  }}
                />
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-px"
                style={{ background: `${color}33` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NeonTagCloud({ data, color }: { data: { name: string; value: number }[]; color: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex flex-wrap gap-2.5">
      {data.map((tag, i) => {
        const intensity = 0.3 + (tag.value / maxVal) * 0.7
        const size = 0.75 + (tag.value / maxVal) * 0.35
        return (
          <div
            key={i}
            className="relative px-4 py-2 rounded-lg cursor-default transition-all duration-300 hover:scale-105 group"
            style={{
              background: `linear-gradient(135deg, ${color}${Math.round(intensity * 20).toString(16).padStart(2, '0')}, ${color}${Math.round(intensity * 8).toString(16).padStart(2, '0')})`,
              border: `1px solid ${color}${Math.round(intensity * 60).toString(16).padStart(2, '0')}`,
              fontSize: `${size}rem`,
              animationDelay: `${i * 50}ms`,
            }}
          >
            <span style={{ color: `${color}`, opacity: intensity }}>{tag.name}</span>
            <span className="ml-2 text-xs font-mono" style={{ color: `${color}88` }}>{tag.value}</span>
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: `0 0 15px ${color}33, inset 0 0 15px ${color}11` }} />
          </div>
        )
      })}
    </div>
  )
}

function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.count), 1)
  const allZero = data.every(d => d.count === 0)
  const W = 800
  const H = 120
  const padL = 10
  const padR = 10
  const padT = 10
  const padB = 24

  const xScale = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR)
  const yScale = (v: number) => padT + (1 - v / maxVal) * (H - padT - padB)

  const points = data.map((d, i) => ({ x: xScale(i), y: allZero ? H - padB : yScale(d.count) }))
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const polygon = [
    ...points.map(p => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${H - padB}`,
    `${points[0].x},${H - padB}`,
  ].join(' ')

  const gridYs = [padT, padT + (H - padT - padB) / 2, H - padB]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00ffff44" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => (
        <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <polygon points={polygon} fill="url(#trendGrad)" />
      <polyline points={polyline} fill="none" stroke="#00ffff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00ffff" />
      ))}
      {data.map((d, i) => {
        if (i % 5 !== 0) return null
        return (
          <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">
            {d.date.slice(5)}
          </text>
        )
      })}
    </svg>
  )
}

const STATS_CONFIG = [
  { key: 'totalPrompts' as const, label: 'Prompt 总数', icon: '📝', color: '#00ffff', desc: '已沉淀模板' },
  { key: 'totalCopies' as const, label: '总使用次数', icon: '📋', color: '#bf00ff', desc: '累计调用' },
  { key: 'totalCategories' as const, label: '分类数量', icon: '📁', color: '#0080ff', desc: '知识维度' },
  { key: 'totalTags' as const, label: '标签数量', icon: '🏷️', color: '#ff6b6b', desc: '细粒度标记' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false) })
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="loading-pulse">
          <div className="text-cyan-400 text-lg">加载数据中...</div>
        </div>
      </div>
    )
  }

  const topMax = Math.max(...stats.topPrompts.map(p => p.copyCount), 1)
  const totalAssets = stats.totalPrompts + stats.totalCategories + stats.totalTags

  return (
    <div className="-mx-6 -mt-4 px-6">
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbitDot {
          from { transform: rotate(0deg) translateX(var(--orbit-r)) rotate(0deg); }
          to { transform: rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg); }
        }
      `}</style>

      <div className="text-center mb-10 animate-fadeIn">
        <h1 className="text-3xl font-bold neon-text mb-2">数据看板</h1>
        <p className="text-gray-500 text-sm">Prompt Hub 实时数据概览</p>
      </div>

      <div className="glass-card p-8 mb-8 animate-slideUp relative overflow-hidden" style={{ animationDelay: '100ms' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,255,255,0.04) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="relative flex-shrink-0">
            <div className="w-44 h-44 relative flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="82" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                <circle cx="90" cy="90" r="82" fill="none" stroke="url(#ringGrad)" strokeWidth="3"
                  strokeDasharray={`${(stats.totalPrompts / Math.max(totalAssets, 1)) * 515} 515`}
                  strokeLinecap="round" transform="rotate(-90 90 90)"
                  style={{ animation: 'ringPulse 4s ease-in-out infinite', filter: 'drop-shadow(0 0 6px rgba(0,255,255,0.4))' }} />
                <circle cx="90" cy="90" r="68" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
                <circle cx="90" cy="90" r="68" fill="none" stroke="url(#ringGrad2)" strokeWidth="2.5"
                  strokeDasharray={`${(stats.totalCopies / Math.max(stats.totalCopies + 100, 1)) * 427} 427`}
                  strokeLinecap="round" transform="rotate(-90 90 90)"
                  style={{ animation: 'ringPulse 4s ease-in-out infinite 0.5s', filter: 'drop-shadow(0 0 6px rgba(191,0,255,0.3))' }} />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00ffff" />
                    <stop offset="100%" stopColor="#0080ff" />
                  </linearGradient>
                  <linearGradient id="ringGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#bf00ff" />
                    <stop offset="100%" stopColor="#ff6b6b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400" style={{ animation: 'countUp 0.8s ease-out both' }}>
                  <AnimatedCounter target={stats.totalPrompts} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Prompts</div>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {STATS_CONFIG.map((item, i) => (
              <div
                key={item.key}
                className="group relative p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{
                  background: `linear-gradient(135deg, ${item.color}08, ${item.color}03)`,
                  border: `1px solid ${item.color}18`,
                  animation: 'countUp 0.6s ease-out both',
                  animationDelay: `${200 + i * 100}ms`,
                }}
              >
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `0 0 20px ${item.color}15, inset 0 1px 0 ${item.color}20` }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${item.color}15`, color: `${item.color}aa` }}>
                      {item.desc}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>
                    <AnimatedCounter target={stats[item.key]} />
                  </div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
                <div className="absolute bottom-0 left-3 right-3 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, transparent, ${item.color}60, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-semibold text-cyan-400 mb-5 flex items-center gap-2">
            <span className="w-1 h-4 bg-cyan-400 rounded-full inline-block" />
            Top 10 最常用 Prompt
          </h3>
          <NeonBarChart
            data={stats.topPrompts.map(p => ({
              label: p.title.length > 20 ? p.title.slice(0, 20) + '...' : p.title,
              value: p.copyCount,
            }))}
            color="#00ffff"
            maxVal={topMax}
          />
        </div>

        <div className="glass-card p-6 animate-slideUp" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold text-purple-400 mb-5 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-400 rounded-full inline-block" />
            标签使用分布
          </h3>
          <NeonTagCloud
            data={stats.tagDistribution.filter(t => t.value > 0)}
            color="#bf00ff"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 animate-slideUp" style={{ animationDelay: '400ms' }}>
          <h3 className="text-sm font-semibold text-blue-400 mb-5 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-400 rounded-full inline-block" />
            按维度分布
          </h3>
          <NeonBarChart
            data={stats.promptsByDimension.filter(d => d.value > 0).map(d => ({
              label: d.name,
              value: d.value,
            }))}
            color="#0080ff"
            maxVal={Math.max(...stats.promptsByDimension.map(d => d.value), 1)}
          />
        </div>

        <div className="glass-card p-6 animate-slideUp" style={{ animationDelay: '500ms' }}>
          <h3 className="text-sm font-semibold text-blue-400 mb-5 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-400 rounded-full inline-block" />
            最近新增
          </h3>
          <div className="space-y-3">
            {stats.recentPrompts.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors timeline-item"
                style={{ animationDelay: `${600 + i * 80}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 pulse-dot" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 animate-slideUp" style={{ animationDelay: '650ms' }}>
          <h3 className="text-sm font-semibold text-green-400 mb-5 flex items-center gap-2">
            <span className="w-1 h-4 bg-green-400 rounded-full inline-block" />
            分类使用排行（复制次数）
          </h3>
          <NeonBarChart
            data={stats.categoryCopyStats.map(c => ({ label: c.name, value: c.copyCount }))}
            color="#00ff88"
            maxVal={Math.max(...stats.categoryCopyStats.map(c => c.copyCount), 1)}
          />
        </div>
        <div className="glass-card p-6 animate-slideUp" style={{ animationDelay: '700ms' }}>
          <h3 className="text-sm font-semibold text-orange-400 mb-5 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-400 rounded-full inline-block" />
            标签使用排行（复制次数）
          </h3>
          <NeonBarChart
            data={stats.tagCopyStats.map(t => ({ label: t.name, value: t.copyCount }))}
            color="#ffa500"
            maxVal={Math.max(...stats.tagCopyStats.map(t => t.copyCount), 1)}
          />
        </div>
      </div>

      <div className="glass-card p-6 mb-8 animate-slideUp" style={{ animationDelay: '600ms' }}>
        <h3 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: '#00ffff' }}>
          <span className="w-1 h-4 rounded-full inline-block" style={{ background: '#00ffff' }} />
          最近 30 天新增趋势
        </h3>
        <TrendChart data={stats.copyTrend} />
      </div>
    </div>
  )
}
