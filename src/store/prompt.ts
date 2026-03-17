'use client'

import { create } from 'zustand'

interface Tag {
  id: number
  name: string
  color: string
}

interface Category {
  id: number
  name: string
  dimensionId: number
  parentId: number | null
  sortOrder: number
  dimension?: Dimension
}

interface Dimension {
  id: number
  name: string
  sortOrder: number
  categories: Category[]
}

interface PromptVariable {
  name: string
  label: string
  type: 'text' | 'enum' | 'number'
  defaultValue: string
  required: boolean
  enumOptions?: string[]
}

interface PromptItem {
  id: number
  title: string
  content: string
  description: string | null
  author: string | null
  variables: PromptVariable[] | null
  version: number
  copyCount: number
  createdAt: string
  updatedAt: string
  categories: { category: Category & { dimension: Dimension } }[]
  tags: { tag: Tag }[]
}

interface PromptState {
  items: PromptItem[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  keyword: string
  categoryId: number | null
  tagId: number | null
  mine: boolean
  dimensions: Dimension[]
  tags: Tag[]

  fetchPrompts: () => Promise<void>
  searchPrompts: (keyword: string) => Promise<void>
  fetchDimensions: () => Promise<void>
  fetchTags: () => Promise<void>
  setPage: (page: number) => void
  setCategoryId: (id: number | null) => void
  setTagId: (id: number | null) => void
  setKeyword: (keyword: string) => void
  setMine: (mine: boolean) => void
  resetFilters: () => void
  copyPrompt: (id: number) => Promise<void>
  deletePrompt: (id: number) => Promise<void>
}

export const usePromptStore = create<PromptState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 12,
  loading: false,
  keyword: '',
  categoryId: null,
  tagId: null,
  mine: false,
  dimensions: [],
  tags: [],

  fetchPrompts: async () => {
    const { page, pageSize, categoryId, tagId, mine } = get()
    set({ loading: true })
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (categoryId) params.set('categoryId', String(categoryId))
    if (tagId) params.set('tagId', String(tagId))
    if (mine) params.set('mine', '1')
    const res = await fetch(`/api/prompts?${params}`)
    if (!res.ok) { set({ loading: false }); return }
    const data = await res.json()
    set({ items: data.items, total: data.total, loading: false })
  },

  searchPrompts: async (keyword: string) => {
    const { page, pageSize } = get()
    set({ loading: true, keyword })
    if (!keyword.trim()) {
      get().fetchPrompts()
      return
    }
    const params = new URLSearchParams({ q: keyword, page: String(page), pageSize: String(pageSize) })
    const res = await fetch(`/api/search?${params}`)
    if (!res.ok) { set({ loading: false }); return }
    const data = await res.json()
    set({ items: data.items, total: data.total, loading: false })
  },

  fetchDimensions: async () => {
    const res = await fetch('/api/categories')
    if (!res.ok) return
    const data = await res.json()
    set({ dimensions: data })
  },

  fetchTags: async () => {
    const res = await fetch('/api/tags')
    if (!res.ok) return
    const data = await res.json()
    set({ tags: data })
  },

  setPage: (page) => {
    set({ page })
    const { keyword } = get()
    keyword ? get().searchPrompts(keyword) : get().fetchPrompts()
  },

  setCategoryId: (id) => {
    set({ categoryId: id, page: 1, keyword: '' })
    get().fetchPrompts()
  },

  setTagId: (id) => {
    set({ tagId: id, page: 1, keyword: '' })
    get().fetchPrompts()
  },

  setKeyword: (keyword) => set({ keyword }),

  setMine: (mine) => {
    set({ mine, page: 1 })
    get().fetchPrompts()
  },

  resetFilters: () => {
    set({ categoryId: null, tagId: null, keyword: '', page: 1 })
    get().fetchPrompts()
  },

  copyPrompt: async (id) => {
    await fetch(`/api/prompts/${id}/copy`, { method: 'PATCH' })
  },

  deletePrompt: async (id) => {
    await fetch(`/api/prompts/${id}`, { method: 'DELETE' })
    get().fetchPrompts()
  },
}))

export type { PromptItem, PromptVariable, Tag, Category, Dimension }
