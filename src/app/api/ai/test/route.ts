import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = process.env.AI_API_KEY || ''
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com'
  const model = process.env.AI_MODEL || 'gpt-4o'

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API Key 未配置' }), { status: 400 })
  }

  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: err }), { status: res.status })
    }

    return new Response(JSON.stringify({ ok: true, model }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
