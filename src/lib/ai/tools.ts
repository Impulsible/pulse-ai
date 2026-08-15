/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/ai/tools.ts

export interface AITool {
  name: string
  description: string
  parameters?: {
    type: 'object'
    properties: Record<string, {
      type: string
      description: string
      required?: boolean
    }>
  }
  execute: (input: string, params?: Record<string, any>) => Promise<string>
}

export interface ToolResult {
  success: boolean
  data?: string
  error?: string
}

// Calculator Tool
export const calculatorTool: AITool = {
  name: 'calculator',
  description: 'Perform mathematical calculations. Supports basic arithmetic, percentages, and parentheses.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate (e.g., "2 + 2" or "10 * (5 + 3)")',
        required: true,
      },
    },
  },
  execute: async (input: string) => {
    try {
      // Remove any non-math characters
      const sanitized = input.replace(/[^0-9+\-*/().% ]/g, '')
      if (!sanitized) {
        return 'Error: No valid mathematical expression provided'
      }
      
      // Safe evaluation
      const result = Function(`"use strict"; return (${sanitized})`)()
      return `Result: ${result}`
    } catch (error) {
      return 'Error: Invalid mathematical expression'
    }
  },
}

// Text Processing Tool
export const textProcessorTool: AITool = {
  name: 'text_processor',
  description: 'Process text: count words, characters, or summarize text',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'The action to perform: "count_words", "count_chars", or "summary"',
        required: true,
      },
      text: {
        type: 'string',
        description: 'The text to process',
        required: true,
      },
    },
  },
  execute: async (input: string) => {
    try {
      const parsed = JSON.parse(input)
      const { action, text } = parsed
      
      if (!text) {
        return 'Error: No text provided'
      }

      switch (action) {
        case 'count_words':
          return `Word count: ${text.split(/\s+/).length}`
        case 'count_chars':
          return `Character count: ${text.length}`
        case 'summary':
          // Simple summary - first 100 chars
          const summary = text.length > 100 ? text.slice(0, 100) + '...' : text
          return `Summary: ${summary}`
        default:
          return 'Error: Unknown action. Use "count_words", "count_chars", or "summary"'
      }
    } catch (error) {
      return 'Error: Invalid input format. Use JSON with "action" and "text" fields.'
    }
  },
}

// Date/Time Tool
export const dateTimeTool: AITool = {
  name: 'date_time',
  description: 'Get current date/time or convert time zones',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'The action: "now", "format", or "timezone"',
        required: true,
      },
      timezone: {
        type: 'string',
        description: 'Time zone (e.g., "UTC", "America/New_York")',
        required: false,
      },
    },
  },
  execute: async (input: string) => {
    try {
      const parsed = JSON.parse(input)
      const { action, timezone } = parsed

      switch (action) {
        case 'now':
          return `Current time: ${new Date().toLocaleString()}`
        case 'format':
          return `Formatted: ${new Date().toISOString()}`
        case 'timezone':
          const tz = timezone || 'UTC'
          return `Time in ${tz}: ${new Date().toLocaleString('en-US', { timeZone: tz })}`
        default:
          return 'Error: Unknown action. Use "now", "format", or "timezone"'
      }
    } catch (error) {
      return 'Error: Invalid input. Use JSON with "action" field.'
    }
  },
}

// Code Snippet Tool
export const codeFormatterTool: AITool = {
  name: 'code_formatter',
  description: 'Format code snippets for display',
  parameters: {
    type: 'object',
    properties: {
      language: {
        type: 'string',
        description: 'Programming language (javascript, python, typescript, etc.)',
        required: true,
      },
      code: {
        type: 'string',
        description: 'The code snippet to format',
        required: true,
      },
    },
  },
  execute: async (input: string) => {
    try {
      const parsed = JSON.parse(input)
      const { language, code } = parsed
      
      if (!code) {
        return 'Error: No code provided'
      }

      return `\`\`\`${language || 'text'}\n${code}\n\`\`\``
    } catch (error) {
      return 'Error: Invalid input. Use JSON with "code" field.'
    }
  },
}

// Search Tool (placeholder for web search)
export const webSearchTool: AITool = {
  name: 'web_search',
  description: 'Search the web for information (placeholder - requires API integration)',
  execute: async (input: string) => {
    // In production, integrate with a search API like Google, Bing, or SerpAPI
    return `Web search is not available in this environment. Would you like me to help with something else?`
  },
}

export class ToolManager {
  private tools: Map<string, AITool> = new Map()
  private toolHistory: { tool: string; input: string; result: string; timestamp: Date }[] = []

  constructor() {
    // Register all tools
    this.registerTool(calculatorTool)
    this.registerTool(textProcessorTool)
    this.registerTool(dateTimeTool)
    this.registerTool(codeFormatterTool)
    this.registerTool(webSearchTool)
  }

  /**
   * Register a new tool
   */
  registerTool(tool: AITool): void {
    this.tools.set(tool.name, tool)
    console.log(`🔧 Tool registered: ${tool.name}`)
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): AITool | undefined {
    return this.tools.get(name)
  }

  /**
   * Execute a tool by name
   */
  async executeTool(name: string, input: string, params?: Record<string, any>): Promise<ToolResult> {
    const tool = this.getTool(name)
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found`,
      }
    }

    try {
      const result = await tool.execute(input, params)
      this.toolHistory.push({
        tool: name,
        input: input,
        result: result,
        timestamp: new Date(),
      })
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      }
    }
  }

  /**
   * List all available tools
   */
  listTools(): AITool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tool descriptions for system prompt
   */
  getToolDescriptions(): string {
    return this.listTools()
      .map(tool => {
        let description = `- ${tool.name}: ${tool.description}`
        if (tool.parameters) {
          const params = Object.entries(tool.parameters.properties || {})
            .map(([key, value]) => `    ${key}: ${value.description}`)
            .join('\n')
          description += `\n  Parameters:\n${params}`
        }
        return description
      })
      .join('\n\n')
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * Get tool execution history
   */
  getHistory(limit = 10): { tool: string; input: string; result: string; timestamp: Date }[] {
    return this.toolHistory.slice(-limit)
  }

  /**
   * Clear tool history
   */
  clearHistory(): void {
    this.toolHistory = []
  }

  /**
   * Get tool usage statistics
   */
  getStats(): {
    totalExecutions: number
    toolUsage: Record<string, number>
    successRate: number
  } {
    const total = this.toolHistory.length
    const toolUsage: Record<string, number> = {}
    
    for (const entry of this.toolHistory) {
      toolUsage[entry.tool] = (toolUsage[entry.tool] || 0) + 1
    }

    return {
      totalExecutions: total,
      toolUsage,
      successRate: total > 0 ? 1 : 0, // Calculate based on results
    }
  }
}

// Export singleton instance
export const toolManager = new ToolManager()