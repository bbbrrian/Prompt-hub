import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface ImportItem {
  title: string
  content: string
  description?: string
  author?: string
  variables?: any
  tags?: string[]
}

function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let inQuote = false
  let cur = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      cols.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur)
  return cols
}

function parseCSV(text: string): ImportItem[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/^"|"$/g, '').trim())
  const titleIdx = headers.indexOf('title')
  const contentIdx = headers.indexOf('content')
  const descIdx = headers.indexOf('description')
  const authorIdx = headers.indexOf('author')
  const tagsIdx = headers.indexOf('tags')

  if (titleIdx === -1 || contentIdx === -1) return []

  const results: ImportItem[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const title = cols[titleIdx]?.replace(/^"|"$/g, '').trim()
    const content = cols[contentIdx]?.replace(/^"|"$/g, '').trim()
    if (!title || !content) continue

    const item: ImportItem = { title, content }
    if (descIdx !== -1 && cols[descIdx]) item.description = cols[descIdx].replace(/^"|"$/g, '').trim()
    if (authorIdx !== -1 && cols[authorIdx]) item.author = cols[authorIdx].replace(/^"|"$/g, '').trim()
    if (tagsIdx !== -1 && cols[tagsIdx]) {
      item.tags = cols[tagsIdx].replace(/^"|"$/g, '').split(';').map(t => t.trim()).filter(Boolean)
    }
    results.push(item)
  }
  return results
}

async function processItems(items: ImportItem[]) {
  let created = 0
  let skipped = 0

  for (const item of items) {
    if (!item.title || !item.content) { skipped++; continue }

    const existing = await prisma.prompt.findFirst({
      where: { title: item.title, isDeleted: false },
    })
    if (existing) { skipped++; continue }

    let tagIds: number[] = []
    if (item.tags?.length) {
      for (const name of item.tags) {
        let tag = await prisma.tag.findUnique({ where: { name } })
        if (!tag) tag = await prisma.tag.create({ data: { name } })
        tagIds.push(tag.id)
      }
    }

    await prisma.prompt.create({
      data: {
        title: item.title,
        content: item.content,
        description: item.description || null,
        author: item.author || null,
        variables: item.variables || undefined,
        tags: tagIds.length ? { create: tagIds.map(id => ({ tagId: id })) } : undefined,
      },
    })
    created++
  }

  return { created, skipped }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''

  let items: ImportItem[]

  if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
    const text = await req.text()
    items = parseCSV(text)
  } else {
    const body = await req.text()
    try {
      const parsed = JSON.parse(body)
      if (!Array.isArray(parsed)) {
        return NextResponse.json({ error: '数据格式错误，需要数组' }, { status: 400 })
      }
      items = parsed
    } catch {
      items = parseCSV(body)
    }
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: '无有效数据' }, { status: 400 })
  }
  if (items.length > 500) {
    return NextResponse.json({ error: '单次最多导入 500 条' }, { status: 400 })
  }

  const { created, skipped } = await processItems(items)
  return NextResponse.json({ created, skipped, total: items.length })
}
