// src/app/api/test-groq/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY
  
  return NextResponse.json({
    hasGroqKey: !!groqKey,
    keyPreview: groqKey ? `${groqKey.slice(0, 10)}...${groqKey.slice(-5)}` : 'No key found',
    nodeEnv: process.env.NODE_ENV,
    groqModel: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
  })
}