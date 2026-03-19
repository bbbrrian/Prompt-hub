import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ALLOWED_FILES: Record<string, string> = {
  'ai-guide': 'ai-guide.md',
  'skill-guide': 'skill-guide.md',
}

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get('file')
  if (!file) {
    const filePath = path.join(process.cwd(), 'src/content/ai-guide.md')
    const content = fs.readFileSync(filePath, 'utf-8')
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
  const filename = ALLOWED_FILES[file]
  if (!filename) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const filePath = path.join(process.cwd(), 'src/content', filename)
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
