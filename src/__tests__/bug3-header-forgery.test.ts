import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'

describe('Bug 3: admin/users route 不应依赖可伪造的请求头', () => {
  const content = readFileSync(join(process.cwd(), 'src/app/api/admin/users/route.ts'), 'utf-8')

  it('不应该读取 x-user-role 请求头做权限判断', () => {
    expect(content).not.toMatch(/headers\.get\(['"]x-user-role['"]\)/)
  })

  it('应该使用 cookie 验证身份', () => {
    expect(content).toMatch(/COOKIE_NAME|ph_token/)
  })

  it('应该调用 verifyToken', () => {
    expect(content).toMatch(/verifyToken/)
  })
})
