'use client'

import { useEffect, useState } from 'react'
import PromptForm from '@/components/ui/PromptForm'

export default function NewPromptPage() {
  const [initialData, setInitialData] = useState<any>(undefined)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const prefillStr = sessionStorage.getItem('prompt-prefill')
    if (prefillStr) {
      try {
        setInitialData(JSON.parse(prefillStr))
      } catch {}
      sessionStorage.removeItem('prompt-prefill')
    }
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <div>
      <h2 className="text-2xl font-bold neon-text mb-6">新建 Prompt</h2>
      <PromptForm initialData={initialData} />
    </div>
  )
}
