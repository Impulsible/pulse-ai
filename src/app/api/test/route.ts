// src/app/api/test/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasGroqKey: !!process.env.GROQ_API_KEY,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({
      received: body,
      method: 'POST',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse JSON',
      details: String(error),
    }, { status: 400 })
  }
}