// src/app/api/test-openai/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY is not set in environment variables',
        hasKey: false,
      }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "Hello, Pulse AI!"' }],
      max_tokens: 20,
    })

    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working!',
      response: completion.choices[0].message.content,
      keyPreview: `${apiKey.slice(0, 10)}...${apiKey.slice(-5)}`,
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 })
  }
}