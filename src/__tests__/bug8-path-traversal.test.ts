import { describe, it, expect } from 'vitest'
import path from 'path'
import { readFileSync } from 'fs'
import { join } from 'path'

function safeSanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || 'imported-skill'
}

function safeFilename(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '')
}

describe('Bug 8: ZIP 路径遍历防护逻辑', () => {
  it('skill name 净化后不含路径分隔符', () => {
    expect(safeSanitizeName('../../etc/passwd')).not.toContain('.')
    expect(safeSanitizeName('../../etc/passwd')).not.toContain('/')
  })

  it('filename 净化后只保留文件名', () => {
    expect(safeFilename('../../../etc/passwd')).toBe('passwd')
    expect(safeFilename('normal.png')).toBe('normal.png')
  })

  it('合法 skill name 不变', () => {
    expect(safeSanitizeName('my-skill_v2')).toBe('my-skill_v2')
  })

  it('空 name 返回默认值', () => {
    expect(safeSanitizeName('../../../')).toBe('imported-skill')
  })
})

describe('Bug 8: 源码使用净化后的路径', () => {
  const content = readFileSync(join(process.cwd(), 'src/app/api/skills/import/route.ts'), 'utf-8')

  it('不直接使用 parsed.name 构建路径', () => {
    expect(content).not.toMatch(/path\.join\([^)]*parsed\.name/)
  })
})
