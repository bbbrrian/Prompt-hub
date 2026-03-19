import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const SYSTEM = `你是一个 Claude Code Skill 描述生成专家。根据用户提供的 Prompt 内容，生成一段简短的 Skill 触发条件描述（1-2句话）。
这段描述会作为 Skill 的 description 字段，用于告诉 Claude Code 什么时候应该触发这个 Skill。
直接返回描述文本，不要加任何格式标记或引号。`

const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRate(ip)) {
    return new Response(JSON.stringify({ error: '请求过于频繁，请稍后再试' }), { status: 429 })
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { content, title } = await req.json()
  if (!content || typeof content !== 'string' || content.length > 10000) {
    return new Response(JSON.stringify({ error: '内容不合法' }), { status: 400 })
  }

  const apiKey = process.env.AI_API_KEY || ''
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com'
  const model = process.env.AI_MODEL || 'gpt-4o'

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI_API_KEY 未配置' }), { status: 400 })
  }

  const userMessage = `Prompt 标题：${title || '未命名'}\n\nPrompt 内容：\n${content}`

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: err }), { status: res.status })
  }

  return new Response(res.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
