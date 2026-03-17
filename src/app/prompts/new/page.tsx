'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import PromptForm from '@/components/ui/PromptForm'

function NewPromptContent() {
  const searchParams = useSearchParams()
  const prefillStr = searchParams.get('prefill')
  let initialData: any = undefined
  if (prefillStr) {
    try {
      initialData = JSON.parse(decodeURIComponent(prefillStr))
    } catch {}
  }

  return (
    <div>
      <h2 className="text-2xl font-bold neon-text mb-6">新建 Prompt</h2>
      <PromptForm initialData={initialData} />
    </div>
  )
}

export default function NewPromptPage() {
  return (
    <Suspense fallback={null}>
      <NewPromptContent />
    </Suspense>
  )
}
