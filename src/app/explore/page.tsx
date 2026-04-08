'use client'

import { useRouter } from 'next/navigation'
import {
  FileTextOutlined,
  CodeOutlined,
  RobotOutlined,
  BranchesOutlined,
  BookOutlined,
} from '@ant-design/icons'
import CardSwap, { Card } from '@/components/ui/CardSwap'

interface LibraryItem {
  name: string
  desc: string
  href: string
  icon: React.ReactNode
  color: string
  gradient: string
}

const libraries: LibraryItem[] = [
  {
    name: 'Prompt 库',
    desc: '结构化管理团队 Prompt 资产',
    href: '/prompts',
    icon: <FileTextOutlined />,
    color: '#22d3ee',
    gradient: 'radial-gradient(circle at 30% 40%, rgba(34,211,238,0.35), transparent 60%)',
  },
  {
    name: 'Skill 库',
    desc: '封装为 Claude Code Skill',
    href: '/skills',
    icon: <CodeOutlined />,
    color: '#a78bfa',
    gradient: 'radial-gradient(circle at 70% 30%, rgba(167,139,250,0.4), transparent 60%)',
  },
  {
    name: 'Agent 库',
    desc: '可执行的智能体集合',
    href: '/agents',
    icon: <RobotOutlined />,
    color: '#34d399',
    gradient: 'radial-gradient(circle at 40% 60%, rgba(52,211,153,0.35), transparent 60%)',
  },
  {
    name: '工作流',
    desc: 'Prompt 编排与流水线',
    href: '/workflows',
    icon: <BranchesOutlined />,
    color: '#fbbf24',
    gradient: 'radial-gradient(circle at 60% 50%, rgba(251,191,36,0.35), transparent 60%)',
  },
  {
    name: 'AI 指南',
    desc: '全员必读 AI 工程化框架',
    href: '/guide',
    icon: <BookOutlined />,
    color: '#f472b6',
    gradient: 'radial-gradient(circle at 50% 40%, rgba(244,114,182,0.35), transparent 60%)',
  },
]

export default function ExplorePage() {
  const router = useRouter()

  return (
    <div className="min-h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-visible">
      <div className="lg:col-span-5 space-y-6 animate-fadeIn z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
          <span className="text-xs text-gray-300 tracking-widest uppercase">Explore Libraries</span>
        </div>

        <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-white tracking-tight leading-[1.1]">
          一站浏览所有
          <br />
          <span className="neon-text">AI 资产库</span>
        </h1>

        <p className="text-base text-gray-400 leading-relaxed max-w-md">
          XTEAMSOFT AI 提示词共享平台沉淀了团队从 Prompt 模板到智能体的全部资产。
          悬停右侧卡片暂停轮播，点击任意卡片直达对应库。
        </p>

        <p className="text-sm text-gray-600 italic">悬停暂停，点击直达 —— 就这么简单。</p>
      </div>

      <div className="lg:col-span-7 relative h-[560px] hidden lg:block">
        <CardSwap
          width={640}
          height={460}
          cardDistance={70}
          verticalDistance={80}
          delay={4000}
          pauseOnHover
        >
          {libraries.map(lib => (
            <Card
              key={lib.href}
              onClick={() => router.push(lib.href)}
              style={{ background: '#000' }}
            >
              <div className="w-full h-full flex flex-col text-white">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 shrink-0">
                  <span className="text-base" style={{ color: lib.color }}>
                    {lib.icon}
                  </span>
                  <span className="text-sm font-semibold tracking-wide">{lib.name}</span>
                </div>

                <div
                  className="flex-1 relative overflow-hidden flex items-center justify-center"
                  style={{ background: lib.gradient }}
                >
                  <span
                    className="leading-none select-none"
                    style={{
                      fontSize: 160,
                      color: lib.color,
                      filter: `drop-shadow(0 0 40px ${lib.color}80) drop-shadow(0 0 80px ${lib.color}40)`,
                    }}
                  >
                    {lib.icon}
                  </span>

                  <div className="absolute bottom-4 left-5 right-5">
                    <p className="text-xs text-gray-300/80 tracking-wide">{lib.desc}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </CardSwap>
      </div>
    </div>
  )
}
