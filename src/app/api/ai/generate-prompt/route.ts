import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const GENERATE_SYSTEM = `你是一个专业的 Prompt 工程师。用户会描述他们需要的 Prompt 功能，你需要生成一个高质量的提示词。

请严格按照以下 JSON 格式返回，不要有任何其他内容：
{
  "title": "简短的标题（20字以内）",
  "description": "对这个 Prompt 用途的简要描述（100字以内）",
  "content": "完整的 Prompt 内容（可以使用 {{变量名}} 格式表示需要用户填写的变量）"
}

风格说明：
- 角色扮演型：以"你是..."开头，设定 AI 的角色和专业背景
- 任务型：直接描述具体任务和期望输出格式
- 分析型：强调分析框架、评估维度和结构化输出`

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

  const { description, style } = await req.json()
  if (!description || typeof description !== 'string' || description.length > 2000) {
    return new Response(JSON.stringify({ error: '描述内容不合法或超出长度限制' }), { status: 400 })
  }

  const apiKey = process.env.AI_API_KEY || ''
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com'
  const model = process.env.AI_MODEL || 'gpt-4o'

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI_API_KEY 未配置' }), { status: 400 })
  }

  const styleLabel = style === 'role' ? '角色扮演型' : style === 'task' ? '任务型' : '分析型'

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
        { role: 'system', content: GENERATE_SYSTEM },
        { role: 'user', content: `请为以下需求生成一个高质量的提示词（风格：${styleLabel}）：\n\n${description}` },
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
