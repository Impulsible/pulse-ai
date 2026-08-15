/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/ai/memory.ts
import { createHash } from 'crypto'

export interface MemoryItem {
  id: string
  type: 'preference' | 'fact' | 'context' | 'conversation'
  content: string
  timestamp: Date
  importance: number // 0-1
  metadata?: Record<string, any> // Additional metadata
}

export interface MemoryOptions {
  maxMemories?: number
  minImportance?: number
}

export class MemorySystem {
  private memories: MemoryItem[] = []
  private maxMemories: number
  private minImportance: number

  constructor(options: MemoryOptions = {}) {
    this.maxMemories = options.maxMemories || 100
    this.minImportance = options.minImportance || 0.3
  }

  /**
   * Add a new memory or update an existing one
   */
  addMemory(item: Omit<MemoryItem, 'id' | 'timestamp'>): MemoryItem {
    const memory: MemoryItem = {
      ...item,
      id: this.generateId(item.content),
      timestamp: new Date(),
    }

    // Check for duplicates and update if found
    const existingIndex = this.memories.findIndex(m => m.id === memory.id)
    if (existingIndex >= 0) {
      this.memories[existingIndex] = {
        ...this.memories[existingIndex],
        ...memory,
        timestamp: new Date(), // Update timestamp on refresh
      }
      return this.memories[existingIndex]
    }

    // Add new memory
    this.memories.push(memory)

    // Sort by importance and timestamp
    this.memories.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance
      }
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

    // Trim if too many memories
    if (this.memories.length > this.maxMemories) {
      this.memories = this.memories.slice(0, this.maxMemories)
    }

    return memory
  }

  /**
   * Get relevant memories based on a query
   */
  getRelevantMemories(query: string, limit = 5): MemoryItem[] {
    if (!query || this.memories.length === 0) return []

    const queryWords = query.toLowerCase().split(/\s+/)
    
    return this.memories
      .filter(m => m.importance >= this.minImportance)
      .map(memory => ({
        memory,
        score: this.calculateRelevance(memory.content, queryWords),
      }))
      .filter(item => item.score > 0.1)
      .sort((a, b) => {
        // Sort by score, then by importance, then by recency
        if (b.score !== a.score) return b.score - a.score
        if (b.memory.importance !== a.memory.importance) return b.memory.importance - a.memory.importance
        return b.memory.timestamp.getTime() - a.memory.timestamp.getTime()
      })
      .slice(0, limit)
      .map(item => item.memory)
  }

  /**
   * Get contextual prompt for AI
   */
  getContextualPrompt(): string {
    const recentMemories = this.memories
      .filter(m => m.type === 'preference' || m.type === 'fact')
      .slice(0, 5)

    if (recentMemories.length === 0) return ''

    return `Relevant user information:
${recentMemories.map(m => `- ${m.content}`).join('\n')}`
  }

  /**
   * Get conversation history context
   */
  getConversationContext(limit = 3): string {
    const conversations = this.memories
      .filter(m => m.type === 'conversation')
      .slice(0, limit)

    if (conversations.length === 0) return ''

    return `Previous conversation context:
${conversations.map(m => `- ${m.content}`).join('\n')}`
  }

  /**
   * Get all memories of a specific type
   */
  getMemoriesByType(type: MemoryItem['type']): MemoryItem[] {
    return this.memories.filter(m => m.type === type)
  }

  /**
   * Get recent memories
   */
  getRecentMemories(limit = 10): MemoryItem[] {
    return this.memories.slice(0, limit)
  }

  /**
   * Check if a memory exists
   */
  hasMemory(content: string): boolean {
    const id = this.generateId(content)
    return this.memories.some(m => m.id === id)
  }

  /**
   * Delete a memory by ID
   */
  deleteMemory(id: string): boolean {
    const initialLength = this.memories.length
    this.memories = this.memories.filter(m => m.id !== id)
    return this.memories.length < initialLength
  }

  /**
   * Clear all memories
   */
  clearMemories(): void {
    this.memories = []
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    total: number
    byType: Record<MemoryItem['type'], number>
    averageImportance: number
  } {
    const byType = this.memories.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    }, {} as Record<MemoryItem['type'], number>)

    const averageImportance = this.memories.length > 0
      ? this.memories.reduce((sum, m) => sum + m.importance, 0) / this.memories.length
      : 0

    return {
      total: this.memories.length,
      byType,
      averageImportance,
    }
  }

  /**
   * Calculate relevance score between content and query
   */
  private calculateRelevance(content: string, queryWords: string[]): number {
    const contentWords = content.toLowerCase().split(/\s+/)
    let matches = 0
    
    for (const word of queryWords) {
      if (contentWords.some(cw => cw.includes(word) || word.includes(cw))) {
        matches += 1
      }
    }
    
    return matches / queryWords.length
  }

  /**
   * Generate a unique ID for a memory
   */
  private generateId(content: string): string {
    return createHash('md5').update(content).digest('hex').slice(0, 16)
  }

  /**
   * Extract important information from a message
   */
  extractImportantInfo(message: string): string[] {
    const patterns = [
      /(?:my|I) (?:prefer|like|want) ([^.!?]+)/i,
      /(?:I|we) (?:use|work with|need) ([^.!?]+)/i,
      /(?:favorite|best|preferred) ([^.!?]+)/i,
    ]

    const extracted: string[] = []
    for (const pattern of patterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        extracted.push(match[1].trim())
      }
    }

    return extracted
  }

  /**
   * Process a message and store important information
   */
  processMessage(message: string): MemoryItem[] {
    const extracted = this.extractImportantInfo(message)
    const added: MemoryItem[] = []

    for (const info of extracted) {
      const memory = this.addMemory({
        type: 'preference',
        content: info,
        importance: 0.7,
      })
      added.push(memory)
    }

    // Store conversation context
    if (message.length > 20) {
      this.addMemory({
        type: 'conversation',
        content: message.slice(0, 100) + (message.length > 100 ? '...' : ''),
        importance: 0.3,
      })
    }

    return added
  }
}

// Export a singleton instance
export const memorySystem = new MemorySystem()