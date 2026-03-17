'use client'

import { useState, useEffect } from 'react'
import { Input, Button, message } from 'antd'

export default function AdminPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setBaseUrl(localStorage.getItem('ai_base_url') || '')
    setModel(localStorage.getItem('ai_model') || '')
  }, [])

  const handleSave = () => {
    if (baseUrl) localStorage.setItem('ai_base_url', baseUrl)
    else localStorage.removeItem('ai_base_url')
    if (model) localStorage.setItem('ai_model', model)
    else localStorage.removeItem('ai_model')
    message.success('配置已保存')
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/ai/test')
      const data = await res.json()
      if (res.ok) {
        message.success(`连接成功，模型：${data.model}`)
      } else {
        message.error(`连接失败：${data.error}`)
      }
    } catch (e: any) {
      message.error(`连接失败：${e.message}`)
    }
    setTesting(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold neon-text">系统管理</h2>

      <div className="glass-card p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-200">AI 配置</h3>
        <p className="text-sm text-gray-500">API Key 通过服务器环境变量 AI_API_KEY 配置，不在前端存储。</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Base URL（可选，留空使用默认）</label>
            <Input
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com 或留空使用环境变量"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Model（可选）</label>
            <Input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="gpt-4o 或留空使用环境变量"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button className="neon-button" onClick={handleSave}>保存配置</button>
          <Button onClick={handleTest} loading={testing}>测试连接</Button>
        </div>
      </div>
    </div>
  )
}
