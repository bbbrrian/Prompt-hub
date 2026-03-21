import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'

describe('Bug 12: 登录路由不泄露敏感信息', () => {
  const content = readFileSync(join(process.cwd(), 'src/app/api/auth/login/route.ts'), 'utf-8')

  it('不包含泄露邮箱的 console.log', () => {
    expect(content).not.toMatch(/console\.log\(.*email/)
  })

  it('不包含泄露 token 长度的 console.log', () => {
    expect(content).not.toMatch(/console\.log\(.*token\.length/)
  })

  it('不包含泄露 COOKIE_NAME 的 console.log', () => {
    expect(content).not.toMatch(/console\.log\(.*COOKIE_NAME/)
  })

  it('保留错误日志 console.error', () => {
    expect(content).toMatch(/console\.error/)
  })
})
