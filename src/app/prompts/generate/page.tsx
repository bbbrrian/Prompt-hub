'use client'

import { useState } from 'react'
import { Button, Radio, Input, Spin, message, Tag } from 'antd'
import { useRouter } from 'next/navigation'

const { TextArea } = Input

interface ParsedPrompt {
  title: string
  description: string
  content: string
}

function parseVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
}

export default function GeneratePage() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState('role')
  const [loading, setLoading] = useState(false)
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<ParsedPrompt | null>(null)
  const [parseError, setParseError] = useState(false)

  const handleGenerate = async () => {
    if (!description.trim()) {
      message.warning('请输入需求描述')
      return
    }
    setLoading(true)
    setRawText('')
    setParsed(null)
    setParseError(false)

    try {
      const res = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, style }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }))
        if (err.error?.includes('API_KEY') || err.error?.includes('未配置')) {
          message.error('AI API Key 未配置，请前往管理页配置')
        } else {
          message.error(err.error || '生成失败')
        }
        setLoading(false)
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
                setRawText(fullText)
              }
            } catch {}
          }
        }
      }

      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const p = JSON.parse(jsonMatch[0])
          setParsed(p)
        } else {
          setParseError(true)
        }
      } catch {
        setParseError(true)
      }
    } catch (e: any) {
      message.error(e.message || '网络错误')
    }

    setLoading(false)
  }

  const handleSave = () => {
    if (!parsed) return
    const prefill = encodeURIComponent(JSON.stringify(parsed))
    router.push(`/prompts/new?prefill=${prefill}`)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold neon-text">AI 生成 Prompt</h2>

      <div className="flex gap-6">
        <div className="w-80 shrink-0 space-y-4">
          <div className="glass-card p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">需求描述</label>
              <TextArea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="描述你想要的 Prompt 功能，例如：一个帮助分析代码安全漏洞的专家助手"
                rows={6}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">风格</label>
              <Radio.Group value={style} onChange={e => setStyle(e.target.value)} className="flex flex-col gap-2">
                <Radio value="role">角色扮演型</Radio>
                <Radio value="task">任务型</Radio>
                <Radio value="analysis">分析型</Radio>
              </Radio.Group>
            </div>

            <Button
              className="neon-button w-full !block text-center"
              onClick={handleGenerate}
              loading={loading}
              disabled={loading}
            >
              AI 生成
            </Button>

            <p className="text-xs text-gray-500">
              如 AI 未配置，请前往 <a href="/admin" className="text-cyan-400 hover:underline">管理页</a> 配置 API Key
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">生成结果</span>
              {loading && <Spin size="small" />}
            </div>

            {!rawText && !loading && (
              <p className="text-gray-600 text-sm py-8 text-center">点击"AI 生成"开始生成</p>
            )}

            {rawText && (
              <pre className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-60">
                {rawText}
              </pre>
            )}
          </div>

          {parsed && !loading && (
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-base font-semibold text-gray-100">{parsed.title}</h3>
              {parsed.description && (
                <p className="text-sm text-gray-400">{parsed.description}</p>
              )}
              <pre className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-60">
                {parsed.content}
              </pre>
              {parseVariables(parsed.content).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">检测到变量：</span>
                  {parseVariables(parsed.content).map(v => (
                    <Tag key={v} color="cyan">{`{{${v}}}`}</Tag>
                  ))}
                </div>
              )}
              <div className="pt-2">
                <button className="neon-button" onClick={handleSave}>
                  确认保存
                </button>
              </div>
            </div>
          )}

          {parseError && !loading && rawText && (
            <div className="glass-card p-4">
              <p className="text-yellow-400 text-sm">无法解析 JSON 结构，请查看上方原始输出</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
