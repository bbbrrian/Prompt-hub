'use client'

import { useEffect, useState } from 'react'
import AgentForm from '@/components/ui/AgentForm'

export default function EditAgentPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/agents/${params.id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d) })
  }, [params.id])

  if (notFound) return <div className="text-center py-20 text-gray-500">Agent 不存在</div>
  if (!data) return null

  return (
    <AgentForm
      isEdit
      agentId={data.id}
      initialData={data}
    />
  )
}
