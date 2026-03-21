import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'

describe('Bug 6: .dockerignore 安全条目', () => {
  const content = readFileSync(join(process.cwd(), '.dockerignore'), 'utf-8')

  it('应该忽略 .env 文件', () => {
    expect(content).toMatch(/\.env\*/)
  })

  it('应该忽略 .git 目录', () => {
    expect(content).toMatch(/^\.git$/m)
  })
})
