import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'

describe('Bug 14: 依赖版本精确锁定', () => {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))

  it('prisma 应使用精确版本（不含 ^）', () => {
    expect(pkg.dependencies['prisma']).not.toMatch(/^\^/)
  })

  it('@prisma/client 应使用精确版本（不含 ^）', () => {
    expect(pkg.dependencies['@prisma/client']).not.toMatch(/^\^/)
  })
})
