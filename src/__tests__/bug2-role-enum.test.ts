import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'

describe('Bug 2: 角色枚举权限检查', () => {
  const categoriesRoute = readFileSync(join(process.cwd(), 'src/app/api/categories/route.ts'), 'utf-8')
  const promptsRoute = readFileSync(join(process.cwd(), 'src/app/api/prompts/[id]/route.ts'), 'utf-8')

  it('categories route 不应该检查 admin（应使用 SUPER_ADMIN）', () => {
    expect(categoriesRoute).not.toMatch(/role !== ['"]admin['"]/)
    expect(categoriesRoute).not.toMatch(/role === ['"]admin['"]/)
  })

  it('categories route 应该检查 SUPER_ADMIN', () => {
    expect(categoriesRoute).toMatch(/SUPER_ADMIN/)
  })

  it('prompts/[id] route 不应该检查 admin（应使用 SUPER_ADMIN）', () => {
    expect(promptsRoute).not.toMatch(/role !== ['"]admin['"]/)
    expect(promptsRoute).not.toMatch(/role === ['"]admin['"]/)
  })

  it('prompts/[id] route 应该检查 SUPER_ADMIN', () => {
    expect(promptsRoute).toMatch(/SUPER_ADMIN/)
  })
})
