'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ConfigProvider, theme, Dropdown, Avatar, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Link from 'next/link'
import { clearUserCache } from '@/hooks/useUser'

export default function Navbar({ children }: { children: React.ReactNode }) {
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
    setUser(null)
    clearUserCache()
    message.success('已退出登录')
    router.push('/login')
  }

  const isAuthPage = pathname === '/login' || pathname === '/register'

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={`text-sm transition-colors whitespace-nowrap pb-1 ${active ? 'nav-active-indicator' : ''}`}
        style={{ color: active ? '#7ba8e8' : undefined }}
        onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = '#7ba8e8' }}
        onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = '' }}
      >
        {label}
      </Link>
    )
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1e50ae',
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
                <Link href="/" className="flex items-center gap-2.5">
                  <img src="/logo.jpg" alt="XTEAMSOFT" className="w-9 h-9 rounded-full object-cover" style={{ border: '1px solid rgba(30,80,174,0.3)' }} />
                  <span className="text-lg font-bold neon-text tracking-wide">Prompt Hub</span>
                </Link>
                {navLink('/', '首页')}
                {navLink('/guide', 'AI 指南')}
              </div>

              <div className="flex items-center gap-5">
                {navLink('/prompts', 'Prompt 库')}
                {navLink('/skills', 'Skill 库')}
                {navLink('/agents', 'Agent 库')}
                {navLink('/workflows', '工作流')}
                {navLink('/dashboard', '数据看板')}
                <Link href="/prompts/new" className="neon-button text-sm whitespace-nowrap">+ 新建</Link>
                {user && (
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'email', label: user.email, disabled: true },
                        { type: 'divider' },
                        { key: 'categories', label: <Link href="/categories">分类管理</Link> },
                        { key: 'favorites', label: <Link href="/favorites">我的收藏</Link> },
                        ...(user.role === 'SUPER_ADMIN' ? [
                          { type: 'divider' as const },
                          { key: 'admin', label: <Link href="/admin">系统管理</Link> },
                          { key: 'admin-users', label: <Link href="/admin/users">用户管理</Link> },
                          { key: 'admin-depts', label: <Link href="/admin/departments">部门管理</Link> },
                          { key: 'admin-audit', label: <Link href="/admin/audit-log">审计日志</Link> },
                        ] : []),
                        ...(user.role === 'DEPT_ADMIN' ? [
                          { type: 'divider' as const },
                          { key: 'dept-users', label: <Link href="/admin/dept-users">部门成员</Link> },
                          { key: 'admin-audit', label: <Link href="/admin/audit-log">审计日志</Link> },
                        ] : []),
                        { type: 'divider' },
                        { key: 'logout', label: '退出登录', danger: true, onClick: handleLogout },
                      ],
                    }}
                    placement="bottomRight"
                  >
                    <Avatar
                      size={32}
                      style={{ backgroundColor: '#1e50ae', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}
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
  )
}
