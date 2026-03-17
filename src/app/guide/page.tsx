'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TocItem {
  id: string
  text: string
  level: number
}

export default function GuidePage() {
  const [content, setContent] = useState('')
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/guide')
      .then(res => res.text())
      .then(md => {
        setContent(md)
        const headings: TocItem[] = []
        const lines = md.split('\n')
        for (const line of lines) {
          const match = line.match(/^(#{1,3})\s+(.+)/)
          if (match) {
            const level = match[1].length
            const text = match[2].replace(/\*\*/g, '')
            const id = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
            headings.push({ id, text, level })
          }
        }
        setToc(headings)
      })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )

    const headings = contentRef.current?.querySelectorAll('h1, h2, h3')
    headings?.forEach(h => observer.observe(h))
    return () => observer.disconnect()
  }, [content])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex gap-8 -mx-6 -mt-4">
      <aside className="w-64 shrink-0 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto hidden lg:block pr-4 pl-6">
        <div className="glass-card p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h3 className="text-sm font-semibold neon-text mb-4 tracking-wider">目录导航</h3>
          <nav className="space-y-1">
            {toc.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-all duration-200 ${
                  activeId === item.id
                    ? 'text-cyan-400 bg-cyan-400/10 border-l-2 border-cyan-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-l-2 border-transparent'
                }`}
                style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
              >
                {item.text}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 max-w-4xl" ref={contentRef}>
        <div className="guide-header text-center mb-12 animate-fadeIn">
          <h1 className="text-3xl font-bold neon-text mb-3">AI 编程助手</h1>
          <p className="text-lg text-gray-400">入门指南 · 使用规范 · 最佳实践</p>
          <p className="text-sm text-gray-600 mt-2">适用对象：全体团队成员（包括非技术岗位）</p>
          <div className="mt-4 inline-block px-4 py-1.5 rounded-full text-xs neon-border text-cyan-400">
            额度有限，用在刀刃上
          </div>
        </div>

        <div className="guide-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => {
                const text = String(children).replace(/\*\*/g, '')
                const id = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                return <h1 id={id} className="text-2xl font-bold neon-text mt-16 mb-6 pb-3 border-b border-cyan-900/30 scroll-mt-24 animate-fadeIn">{children}</h1>
              },
              h2: ({ children }) => {
                const text = String(children).replace(/\*\*/g, '')
                const id = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                return <h2 id={id} className="text-xl font-semibold text-cyan-300 mt-10 mb-4 scroll-mt-24 animate-fadeIn">{children}</h2>
              },
              h3: ({ children }) => {
                const text = String(children).replace(/\*\*/g, '')
                const id = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                return <h3 id={id} className="text-lg font-semibold text-blue-300 mt-8 mb-3 scroll-mt-24">{children}</h3>
              },
              p: ({ children }) => <p className="text-gray-300 leading-7 mb-4">{children}</p>,
              ul: ({ children }) => <ul className="space-y-2 mb-4 ml-4">{children}</ul>,
              ol: ({ children }) => <ol className="space-y-2 mb-4 ml-4 list-decimal">{children}</ol>,
              li: ({ children }) => (
                <li className="text-gray-300 leading-7 flex items-start gap-2">
                  <span className="text-cyan-500 mt-2 shrink-0">•</span>
                  <span>{children}</span>
                </li>
              ),
              blockquote: ({ children }) => (
                <div className="glass-card p-4 my-4 border-l-3 border-cyan-500/50" style={{ borderLeft: '3px solid rgba(0,255,255,0.5)' }}>
                  {children}
                </div>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse glass-card overflow-hidden rounded-lg">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-cyan-900/20">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider border-b border-cyan-900/30">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-sm text-gray-300 border-b border-white/5">{children}</td>
              ),
              strong: ({ children }) => <strong className="text-cyan-300 font-semibold">{children}</strong>,
              hr: () => (
                <div className="my-12 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                  <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                </div>
              ),
              code: ({ children, className }) => {
                if (className) {
                  return <code className="block bg-black/40 rounded-lg p-4 text-sm text-cyan-200 overflow-x-auto my-4">{children}</code>
                }
                return <code className="bg-cyan-900/20 text-cyan-300 px-1.5 py-0.5 rounded text-sm">{children}</code>
              },
              input: ({ checked }) => (
                <span className={`inline-block w-4 h-4 rounded border mr-2 align-middle ${checked ? 'bg-cyan-500/30 border-cyan-500' : 'border-gray-600'}`}>
                  {checked && <span className="block w-full h-full text-center text-xs text-cyan-400">✓</span>}
                </span>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
