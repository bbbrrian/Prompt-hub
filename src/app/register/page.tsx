'use client'

import { useState } from 'react'
import { Input, Button, message } from 'antd'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!email || !password) {
      message.error('请填写邮箱和密码')
      return
    }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) {
      window.location.href = '/'
      return
    } else {
      message.error(data.error || '注册失败')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 w-full max-w-sm space-y-5">
        <h2 className="text-2xl font-bold neon-text text-center">注册 Prompt Hub</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">邮箱</label>
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">密码（至少6位）</label>
          <Input.Password
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <Button type="primary" block size="large" loading={loading} onClick={handleRegister}>
          注册
        </Button>
        <p className="text-center text-sm text-gray-500">
          已有账号？<a href="/login" className="text-cyan-400 hover:underline">登录</a>
        </p>
      </div>
    </div>
  )
}
