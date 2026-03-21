import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'

describe('Bug 10: 安全响应头', () => {
  const config = readFileSync(join(process.cwd(), 'next.config.js'), 'utf-8')

  it('应包含 Content-Security-Policy', () => {
    expect(config).toMatch(/Content-Security-Policy/)
  })

  it('应包含 Strict-Transport-Security', () => {
    expect(config).toMatch(/Strict-Transport-Security/)
  })
})

describe('Bug 11: 搜索 API 只返回 PUBLIC 内容', () => {
  const content = readFileSync(join(process.cwd(), 'src/app/api/search/route.ts'), 'utf-8')

  it('搜索 API 应过滤 visibility: PUBLIC', () => {
    expect(content).toMatch(/visibility.*PUBLIC|PUBLIC.*visibility/)
  })
})
