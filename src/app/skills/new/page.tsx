'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import SkillBuilder from '@/components/ui/SkillBuilder'
import type { PromptItem } from '@/store/prompt'

function NewSkillContent() {
  const searchParams = useSearchParams()
  const promptId = searchParams.get('promptId')
  const [prompt, setPrompt] = useState<PromptItem | null>(null)

  useEffect(() => {
    if (!promptId) return
    fetch(`/api/prompts/${promptId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPrompt(data) })
  }, [promptId])

  if (promptId && !prompt) return null

  return <SkillBuilder prompt={prompt} />
}

export default function NewSkillPage() {
  return (
    <Suspense fallback={null}>
      <NewSkillContent />
    </Suspense>
  )
}
