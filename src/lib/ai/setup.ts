/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/ai/setup.ts

/**
 * Validates the AI configuration and tests the connection to Groq API
 * @returns Object containing validation status and any errors
 */
export async function validateAIConfiguration(): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // Check for Groq API key
  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey) {
    errors.push('GROQ_API_KEY is not set in environment variables')
  }

  // Check for Groq model
  const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  console.log(`📤 Using Groq model: ${groqModel}`)

  // Test API connection if key exists
  if (groqApiKey) {
    try {
      // Test Groq API connection by listing models
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        errors.push(`Failed to connect to Groq API: ${response.status} - ${errorText}`)
      } else {
        const data = await response.json()
        const availableModels = data.data?.map((m: any) => m.id) || []
        console.log('✅ Groq API connection successful')
        console.log(`📊 Available models: ${availableModels.join(', ')}`)
        
        // Check if the configured model is available
        if (!availableModels.includes(groqModel)) {
          errors.push(`Configured model "${groqModel}" is not available. Available models: ${availableModels.join(', ')}`)
        }
      }
    } catch (error) {
      errors.push(`Failed to reach Groq API: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check for optional OpenAI key (if you want to support both)
  if (process.env.OPENAI_API_KEY) {
    console.log('ℹ️ OpenAI API key found (optional, currently using Groq)')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Gets the current AI configuration status
 * @returns Object with configuration details
 */
export function getAIConfigStatus() {
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  const openAIApiKey = process.env.OPENAI_API_KEY

  return {
    provider: groqApiKey ? 'Groq' : 'None',
    groq: {
      apiKeyConfigured: !!groqApiKey,
      model: groqModel,
    },
    openai: {
      apiKeyConfigured: !!openAIApiKey,
    },
  }
}

/**
 * Checks if AI is properly configured and ready to use
 * @returns Boolean indicating if AI is ready
 */
export function isAIReady(): boolean {
  return !!process.env.GROQ_API_KEY
}