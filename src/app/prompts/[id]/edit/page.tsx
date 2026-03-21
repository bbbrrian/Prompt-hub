'use client'

import { useEffect, useState, Suspense } from 'react'
import { Spin, Result, Button } from 'antd'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import PromptForm from '@/components/ui/PromptForm'
import { useUser, canModifyResource } from '@/hooks/useUser'

function EditPromptContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentUser = useUser()
  const [data, setData] = useState<any>(null)
  const [ownerId, setOwnerId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/prompts/${params.id}`)
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(prompt => {
        setOwnerId(prompt.userId ?? prompt.user?.id ?? null)
        const prefillStr = searchParams.get('prefill')
        let prefill: any = null
        if (prefillStr) {
          try { prefill = JSON.parse(decodeURIComponent(prefillStr)) } catch {}
        }
        setData({
          id: prompt.id,
          title: prefill?.title ?? prompt.title,
          content: prefill?.content ?? prompt.content,
          description: prefill?.description ?? prompt.description ?? '',
          author: prompt.author || '',
          categoryIds: prompt.categories.map((c: any) => c.category.id),
          tagIds: prompt.tags.map((t: any) => t.tag.id),
          variables: prompt.variables || [],
        })
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return <div className="flex justify-center py-20"><Spin size="large" /></div>
  }

  if (error) {
    return (
      <Result
        status="404"
        title="Prompt 不存在"
        subTitle="该 Prompt 可能已被删除"
        extra={<Button type="primary" onClick={() => router.push('/prompts')}>返回列表</Button>}
      />
    )
  }

  const isOwner = canModifyResource(currentUser, { userId: ownerId })

  return (
    <div>
      <h2 className="text-2xl font-bold neon-text mb-6">{isOwner ? '编辑 Prompt' : '填写变量并保存为我的副本'}</h2>
      <PromptForm initialData={data} isEdit={isOwner} isFork={!isOwner} />
    </div>
  )
}

export default function EditPromptPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spin size="large" /></div>}>
      <EditPromptContent />
    </Suspense>
  )
}
