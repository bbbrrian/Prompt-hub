'use client'

import { Tag } from 'antd'
import { usePromptStore } from '@/store/prompt'

export default function CategoryFilter() {
  const { dimensions, tags, categoryId, tagId, setCategoryId, setTagId, resetFilters } = usePromptStore()
  const hasFilter = categoryId !== null || tagId !== null

  return (
    <div className="space-y-4">
      {hasFilter && (
        <button
          onClick={resetFilters}
          className="text-xs text-gray-500 hover:text-cyan-400 transition-colors underline"
        >
          重置筛选
        </button>
      )}
      {dimensions.map((dim) => (
        <div key={dim.id}>
          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">{dim.name}</h4>
          <div className="flex flex-wrap gap-1">
            {dim.categories.map((cat) => (
              <Tag
                key={cat.id}
                className={`cursor-pointer !text-xs ${categoryId === cat.id ? '!border-cyan-400 !text-cyan-400' : ''}`}
                onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
              >
                {cat.name}
              </Tag>
            ))}
          </div>
        </div>
      ))}

      {tags.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">标签</h4>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Tag
                key={tag.id}
                color={tagId === tag.id ? tag.color : undefined}
                className={`cursor-pointer !text-xs ${tagId === tag.id ? '' : '!text-gray-400'}`}
                onClick={() => setTagId(tagId === tag.id ? null : tag.id)}
              >
                {tag.name}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
