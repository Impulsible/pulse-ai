/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Get API key from environment
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

export async function POST(request: NextRequest) {
  console.log('=== CHAT API CALLED (Groq) ===')
  
  try {
    // Check if API key is configured
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Groq API key is not configured. Please add GROQ_API_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { message, stream = false, messages = [] } = body

    if (!message && messages.length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Build messages array with full conversation history
    const chatMessages = [
      {
        role: 'system' as const,
        content: `You are Pulse, an intelligent AI assistant with your own identity. 
You are helpful, thoughtful, and conversational. You have access to real-time information 
and can help with a wide range of tasks including coding, writing, analysis, and general questions.
You remember context from the conversation and adapt your responses accordingly.
Be concise but thorough. Use markdown for formatting when appropriate.
Maintain conversation flow and remember what was discussed earlier.`,
      },
      // Include full conversation history
      ...messages,
    ]

    // Add the current message if not already in history
    if (message && !messages.some((m: { role: string; content: string }) => m.role === 'user' && m.content === message)) {
      chatMessages.push({ role: 'user' as const, content: message })
    }

    console.log(`📤 Sending ${chatMessages.length} messages to Groq`)
    console.log(`📤 Using model: ${GROQ_MODEL}`)

    // Groq API endpoint
    const url = 'https://api.groq.com/openai/v1/chat/completions'

    if (stream) {
      // Handle streaming response
      console.log('🔄 Streaming mode enabled')
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
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
        console.error('❌ Groq API error:', response.status, errorText)
        
        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Groq API key. Please check your GROQ_API_KEY configuration.' },
            { status: 401 }
          )
        }
        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          )
        }
        
        return NextResponse.json(
          { error: `Groq API error: ${response.status}`, details: errorText },
          { status: response.status }
        )
      }

      // Return the stream directly
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Handle regular response
      console.log('📝 Non-streaming mode')
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
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
        console.error('❌ Groq API error:', response.status, errorText)
        
        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Groq API key. Please check your GROQ_API_KEY configuration.' },
            { status: 401 }
          )
        }
        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          )
        }
        
        return NextResponse.json(
          { error: `Groq API error: ${response.status}`, details: errorText },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log('✅ Groq response received')

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
    }
  } catch (error) {
    console.error('❌ Chat API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Groq API key configuration.' },
          { status: 401 }
        )
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log('✅ GET request received to /api/chat')
  
  return NextResponse.json({
    status: 'ok',
    message: 'Chat API is running',
    model: GROQ_MODEL,
    hasApiKey: !!GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  })
}

export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Conversation cleared successfully',
    })
  } catch (error) {
    console.error('Clear history error:', error)
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    )
  }
}