import { NextRequest } from 'next/server'

const OPTIMIZE_SYSTEM = `你是一个专业的 Prompt 优化专家。用户会提供一个现有的提示词，你需要对其进行优化，使其更加清晰、专业和有效。

请严格按照以下 JSON 格式返回，不要有任何其他内容：
{
  "title": "优化后的标题",
  "description": "优化后的描述",
  "content": "优化后的 Prompt 内容"
}

优化要求：
1. 保持原有核心功能不变
2. 使指令更加清晰明确
3. 优化结构和格式
4. 如有变量，保留 {{变量名}} 格式`

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

  const { title, content, description } = await req.json()
  if (!title || typeof title !== 'string' || title.length > 200) {
    return new Response(JSON.stringify({ error: '标题不合法' }), { status: 400 })
  }
  if (!content || typeof content !== 'string' || content.length > 10000) {
    return new Response(JSON.stringify({ error: '内容超出长度限制' }), { status: 400 })
  }

  const apiKey = process.env.AI_API_KEY || ''
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com'
  const model = process.env.AI_MODEL || 'gpt-4o'

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI_API_KEY 未配置' }), { status: 400 })
  }

  const userMessage = `请优化以下提示词：

标题：${title}
${description ? `描述：${description}\n` : ''}
内容：
${content}`

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
        { role: 'system', content: OPTIMIZE_SYSTEM },
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
