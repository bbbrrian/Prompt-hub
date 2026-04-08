'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ConfigProvider, theme, Dropdown, Avatar, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Link from 'next/link'
import { clearUserCache } from '@/hooks/useUser'
import StaggeredMenu, { StaggeredMenuItem } from '@/components/ui/StaggeredMenu'

const MENU_ITEMS: StaggeredMenuItem[] = [
  { label: '首页', ariaLabel: '返回首页', link: '/' },
  { label: 'AI 指南', ariaLabel: '查看 AI 指南', link: '/guide' },
  { label: 'Prompt 库', ariaLabel: '浏览 Prompt 库', link: '/prompts' },
  { label: 'Skill 库', ariaLabel: '浏览 Skill 库', link: '/skills' },
  { label: 'Agent 库', ariaLabel: '浏览 Agent 库', link: '/agents' },
  { label: '工作流', ariaLabel: '查看工作流', link: '/workflows' },
  { label: '数据看板', ariaLabel: '打开数据看板', link: '/dashboard' },
]

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

  const headerRight = (
    <>
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
    </>
  )

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
          <StaggeredMenu
            isFixed
            position="right"
            items={MENU_ITEMS}
            displayItemNumbering={false}
            logoUrl="/logo.jpg"
            brandName="Prompt Hub"
            brandHref="/"
            headerRight={headerRight}
            menuButtonColor="#e8eef9"
            openMenuButtonColor="#e8eef9"
            changeMenuColorOnOpen
            colors={['#1a2b52', '#0f1a36']}
            accentColor="#1e50ae"
            contactTitle="西安中朗智控科技有限公司"
            contactLines={[
              { text: '电话 029-81111822', href: 'tel:02981111822' },
            ]}
          />
        )}
        <main className={isAuthPage ? '' : 'pt-20 pb-8 px-6 max-w-7xl mx-auto'}>
          {children}
        </main>
      </div>
    </ConfigProvider>
  )
}
