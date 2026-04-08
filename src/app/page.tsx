'use client'

import dynamic from 'next/dynamic'

const Orb = dynamic(() => import('@/components/three/Orb'), { ssr: false })
const Particles = dynamic(() => import('@/components/three/Particles'), { ssr: false })

export default function Home() {
  return (
    <>
      <div className="fixed inset-x-0 top-16 bottom-0 z-0">
        <Orb hue={0} hoverIntensity={1.75} rotateOnHover backgroundColor="#000000" />
      </div>

      <div className="fixed inset-x-0 top-16 bottom-0 z-[5] pointer-events-none">
        <Particles
          particleColors={['#7ba8e8', '#1e50ae', '#9b8de8', '#ffffff']}
          particleCount={320}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles
          sizeRandomness={1}
          cameraDistance={20}
          disableRotation={false}
          pixelRatio={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
        />
      </div>

      <div className="fixed inset-x-0 top-16 bottom-0 z-10 flex items-center justify-center pointer-events-none px-6">
        <div className="text-center max-w-xl animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
            <span className="text-xs text-gray-200 tracking-widest uppercase">
              XTEAMSOFT · AI Prompt Platform
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-tight whitespace-nowrap drop-shadow-[0_0_30px_rgba(30,80,174,0.5)]">
            西安中朗智控科技有限公司
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-2">AI 提示词共享平台</p>
          <p className="text-xs text-gray-500 mb-10 tracking-widest uppercase">
            规范驱动 · 模板沉淀 · 效果可量化
          </p>

          <div className="flex gap-4 justify-center pointer-events-auto">
            <a
              href="/explore"
              className="px-8 py-3 rounded-full bg-white text-black text-sm font-semibold hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
            >
              浏览所有库
            </a>
            <a
              href="/prompts/new"
              className="px-8 py-3 rounded-full bg-white/5 border border-white/20 text-white text-sm font-semibold backdrop-blur-md hover:bg-white/10 hover:border-white/40 transition-all"
            >
              创建新 Prompt
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
