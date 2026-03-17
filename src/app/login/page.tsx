'use client'

import { useState } from 'react'
import { Input, Button, message } from 'antd'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      message.error('请填写邮箱和密码')
      return
    }
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) {
      router.push('/')
    } else {
      message.error(data.error || '登录失败')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 w-full max-w-sm space-y-5">
        <h2 className="text-2xl font-bold neon-text text-center">登录 Prompt Hub</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">邮箱</label>
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            onPressEnter={handleLogin}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">密码</label>
          <Input.Password
            value={password}
            onChange={e => setPassword(e.target.value)}
            onPressEnter={handleLogin}
          />
        </div>
        <Button type="primary" block size="large" loading={loading} onClick={handleLogin}>
          登录
        </Button>
        <p className="text-center text-sm text-gray-500">
          没有账号？<a href="/register" className="text-cyan-400 hover:underline">注册</a>
        </p>
      </div>
    </div>
  )
}
