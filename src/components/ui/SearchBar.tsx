'use client'

import { useCallback, useRef } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { usePromptStore } from '@/store/prompt'

export default function SearchBar() {
  const { keyword, setKeyword, searchPrompts } = usePromptStore()
  const timerRef = useRef<NodeJS.Timeout>(undefined)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setKeyword(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      searchPrompts(val)
    }, 400)
  }, [setKeyword, searchPrompts])

  return (
    <div className="relative">
      <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={keyword}
        onChange={handleChange}
        placeholder="搜索 Prompt 标题、内容..."
        className="search-input !pl-10"
      />
    </div>
  )
}
