
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function buildSystemPrompt(memoryContext?: string, userName?: string): string {
  const date = new Date().toISOString().split('T')[0]

  let prompt = `You are Pulse, an intelligent AI assistant with your own identity.
You are helpful, thoughtful, and conversational. You maintain full context throughout the conversation
and remember what was discussed earlier. You have a warm, engaging personality.

Guidelines:
- Reference earlier parts of the conversation naturally when relevant
- Be concise but thorough
- Use markdown for formatting (code blocks with language specifiers, lists, headers)
- Ask clarifying questions when needed
- Admit uncertainty rather than fabricate
- Current date: ${date}`

  if (userName) {
    prompt += `\n\nThe user's name is **${userName}**. Address them naturally when appropriate.`
  }

  if (memoryContext && memoryContext.trim()) {
    prompt += `\n\n---\n\n## What you remember about this user\n\n${memoryContext}\n\n---\n\nUse this information naturally to personalize your responses. Don't announce "I remember that…" unless the user explicitly asks what you know about them.`
  }

  return prompt
}

export async function POST(request: NextRequest) {
  console.log('=== CHAT API CALLED ===')

  try {
    if (!GROQ_API_KEY) {
      console.error('❌ API key not configured')
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      message,
      messages = [],
      memoryContext,
      userName,
      stream = false,
    } = body as {
      message?: string
      messages?: IncomingMessage[]
      memoryContext?: string
      userName?: string
      stream?: boolean
    }

    if (!message && messages.length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // ─── BUILD MESSAGE CHAIN ─────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(memoryContext, userName)

    const chatMessages: IncomingMessage[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Add prior conversation history (filter out any pre-existing system messages)
    if (Array.isArray(messages) && messages.length > 0) {
      const filtered = messages.filter((m) => m.role !== 'system')
      chatMessages.push(...filtered)
    }

    // Add the current message if not already the last item in history
    if (message?.trim()) {
      const last = chatMessages[chatMessages.length - 1]
      const alreadyIncluded =
        last?.role === 'user' && last?.content === message.trim()

      if (!alreadyIncluded) {
        chatMessages.push({ role: 'user', content: message.trim() })
      }
    }

    console.log(`📤 Sending ${chatMessages.length} messages to AI provider`)
    console.log(`📤 Chain: ${chatMessages.map((m) => m.role).join(' → ')}`)
    if (memoryContext) console.log(`🧠 Memory context: ${memoryContext.length} chars`)
    if (userName) console.log(`👤 User: ${userName}`)

    const url = 'https://api.groq.com/openai/v1/chat/completions'

    // ─── STREAMING RESPONSE ──────────────────────────────────────────
    if (stream) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: chatMessages,
          stream: true,
          max_tokens: parseInt(process.env.GROQ_MAX_TOKENS || '4096'),
          temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7'),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ AI provider error:', response.status, errorText)

        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Authentication error with AI service.' },
            { status: 401 }
          )
        }
        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again in a moment.' },
            { status: 429 }
          )
        }
        return NextResponse.json(
          { error: `AI service error (${response.status})` },
          { status: response.status }
        )
      }

      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // ─── NON-STREAMING RESPONSE ──────────────────────────────────────
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: chatMessages,
        max_tokens: parseInt(process.env.GROQ_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7'),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ AI provider error:', response.status, errorText)

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication error with AI service.' },
          { status: 401 }
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `AI service error (${response.status})` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Response received')

    return NextResponse.json({
      content: data.choices?.[0]?.message?.content || '',
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
      },
      model: GROQ_MODEL,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Chat API error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    model: GROQ_MODEL,
    hasApiKey: !!GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  })
}

export async function DELETE() {
  return NextResponse.json({ message: 'Conversation cleared successfully' })
}