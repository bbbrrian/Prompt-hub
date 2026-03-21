import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const skillId = formData.get('skillId') as string | null

  if (!file) return NextResponse.json({ error: '未上传文件' }, { status: 400 })

  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '文件不能超过 10MB' }, { status: 400 })

  const ext = path.extname(file.name).replace(/[^.a-zA-Z0-9]/g, '').toLowerCase()
  const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.md', '.json', '.csv', '.yaml', '.yml', '.xlsx', '.xls', '.doc', '.docx'])
  if (!ALLOWED_EXTS.has(ext)) return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
  const filename = `${crypto.randomUUID()}${ext}`

  const id = (skillId || 'temp').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || 'temp'
  const dir = path.join(process.cwd(), 'public', 'uploads', 'skills', id, 'assets')
  const baseDir = path.join(process.cwd(), 'public', 'uploads')
  if (!dir.startsWith(baseDir)) return NextResponse.json({ error: '非法路径' }, { status: 400 })
  fs.mkdirSync(dir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, buffer)

  const storedPath = `/uploads/skills/${id}/assets/${filename}`

  return NextResponse.json({
    filename,
    originalName: file.name,
    mimetype: file.type,
    size: file.size,
    storedPath,
  })
}
