'use client'

import { create } from 'zustand'

interface WorkflowStep {
  id?: number
  promptId: number
  stepOrder: number
  inputMapping: Record<string, string> | null | undefined
  prompt?: { id: number; title: string; content?: string; variables?: any }
}

interface Workflow {
  id: number
  name: string
  description: string | null
  steps: WorkflowStep[]
  createdAt: string
  updatedAt: string
}

interface WorkflowState {
  workflows: Workflow[]
  loading: boolean
  fetchWorkflows: () => Promise<void>
  createWorkflow: (data: { name: string; description?: string; steps: Omit<WorkflowStep, 'id' | 'prompt'>[] }) => Promise<void>
  updateWorkflow: (id: number, data: { name: string; description?: string; steps: Omit<WorkflowStep, 'id' | 'prompt'>[] }) => Promise<void>
  deleteWorkflow: (id: number) => Promise<void>
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  loading: false,

  fetchWorkflows: async () => {
    set({ loading: true })
    const res = await fetch('/api/workflows')
    if (!res.ok) { set({ loading: false }); return }
    const data = await res.json()
    set({ workflows: data, loading: false })
  },

  createWorkflow: async (data) => {
    await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    get().fetchWorkflows()
  },

  updateWorkflow: async (id, data) => {
    await fetch(`/api/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    get().fetchWorkflows()
  },

  deleteWorkflow: async (id) => {
    await fetch(`/api/workflows/${id}`, { method: 'DELETE' })
    get().fetchWorkflows()
  },
}))

export type { Workflow, WorkflowStep }
