'use client'

import '@/styles/globals.css'
import { ConfigProvider, theme, Dropdown, Avatar, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)

  useEffect(() => {
    if (pathname === '/login' || pathname === '/register') return
    fetch('/api/auth/me').then(r => {
      if (r.ok) return r.json()
      return null
    }).then(data => {
      if (data?.email) setUser(data)
    })
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    message.success('已退出登录')
    router.push('/login')
  }

  const isAuthPage = pathname === '/login' || pathname === '/register'

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href))
    return (
      <a
        href={href}
        className={`text-sm transition-colors whitespace-nowrap pb-1 ${active ? 'nav-active-indicator' : ''}`}
        style={{ color: active ? '#00ffff' : undefined }}
        onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = '#00ffff' }}
        onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = '' }}
      >
        {label}
      </a>
    )
  }

  return (
    <html lang="zh-CN">
      <body>
        <ConfigProvider
          locale={zhCN}
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              colorPrimary: '#00ffff',
              colorBgContainer: 'rgba(255, 255, 255, 0.03)',
              colorBgElevated: 'rgba(10, 10, 30, 0.95)',
              colorBorder: 'rgba(255, 255, 255, 0.1)',
              colorText: '#e0e0e0',
              colorTextSecondary: 'rgba(255, 255, 255, 0.5)',
              borderRadius: 8,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            },
          }}
        >
          <div className="min-h-screen">
            {!isAuthPage && (
              <header className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-x-0 rounded-none">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6 shrink-0">
                    <a href="/" className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xl font-bold neon-text tracking-wider"
                        style={{ background: 'rgba(0,255,255,0.06)', border: '1px solid rgba(0,255,255,0.12)' }}>
                        ⚡ Prompt Hub
                      </span>
                    </a>
                    {navLink('/', '首页')}
                    {navLink('/guide', 'AI 指南')}
                  </div>

                  <div className="flex items-center gap-5">
                    {navLink('/prompts', 'Prompt 库')}
                    {navLink('/agents', 'Agent 库')}
                    {navLink('/workflows', '工作流')}
                    {navLink('/dashboard', '数据看板')}
                    <a href="/prompts/new" className="neon-button text-sm whitespace-nowrap">+ 新建</a>
                    {user && (
                      <Dropdown
                        menu={{
                          items: [
                            { key: 'email', label: user.email, disabled: true },
                            { type: 'divider' },
                            { key: 'categories', label: <a href="/categories">分类管理</a> },
                            { key: 'favorites', label: <a href="/favorites">我的收藏</a> },
                            { key: 'admin', label: <a href="/admin">系统管理</a> },
                            { type: 'divider' },
                            { key: 'logout', label: '退出登录', danger: true, onClick: handleLogout },
                          ],
                        }}
                        placement="bottomRight"
                      >
                        <Avatar
                          size={32}
                          style={{ backgroundColor: '#00ffff', color: '#0a0a1e', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {user.email[0].toUpperCase()}
                        </Avatar>
                      </Dropdown>
                    )}
                  </div>
                </div>
              </header>
            )}
            <main className={isAuthPage ? '' : 'pt-20 pb-8 px-6 max-w-7xl mx-auto'}>
              {children}
            </main>
          </div>
        </ConfigProvider>
      </body>
    </html>
  )
}
