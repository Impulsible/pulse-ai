/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/ai/memory.ts

import { createHash } from 'crypto'

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES — Entity-based memory model
   ═══════════════════════════════════════════════════════════════════════════════ */

export type MemoryType =
  | 'identity'
  | 'preference'
  | 'fact'
  | 'skill'
  | 'goal'
  | 'relationship'
  | 'context'
  | 'conversation'
  | 'event'
  | 'opinion'

export type SentimentTag =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'critical'
  | 'sensitive'

export type Confidence = 'certain' | 'inferred' | 'guessed'

export interface MemoryItem {
  id: string
  type: MemoryType
  content: string
  subject: string
  predicate?: string
  object?: string
  timestamp: Date
  lastAccessed: Date
  accessCount: number
  importance: number
  confidence: Confidence
  sentiment?: SentimentTag
  source?: string
  entities?: string[]
  tags?: string[]
  expiresAt?: Date
  linkedIds?: string[]
  metadata?: Record<string, any>
}

export interface Entity {
  id: string
  name: string
  type: 'person' | 'place' | 'organization' | 'project' | 'concept' | 'thing'
  aliases: string[]
  memoryIds: string[]
  firstMentioned: Date
  lastMentioned: Date
  mentionCount: number
}

export interface MemoryOptions {
  maxMemories?: number
  minImportance?: number
  decayRate?: number
  enablePersistence?: boolean
  storageKey?: string
  userId?: string
}

export interface SearchOptions {
  limit?: number
  types?: MemoryType[]
  minImportance?: number
  minConfidence?: Confidence
  includeSensitive?: boolean
  boostRecent?: boolean
}

export interface MemoryStats {
  total: number
  byType: Record<MemoryType, number>
  bySentiment: Record<SentimentTag, number>
  averageImportance: number
  averageAccessCount: number
  entities: number
  memoryUsage: string
  oldestMemory?: Date
  newestMemory?: Date
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EXTRACTION HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */

function cleanValue(str: string): string {
  return str
    .trim()
    .replace(/[.,!?;:]+$/, '')
    .replace(/\s+/g, ' ')
}

function titleCase(str: string): string {
  return cleanValue(str)
    .split(' ')
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EXTRACTION PATTERNS — flexible NLP rules
   ═══════════════════════════════════════════════════════════════════════════════ */

interface ExtractionPattern {
  name: string
  regex: RegExp
  type: MemoryType
  importance: number
  buildContent: (match: RegExpMatchArray) => {
    content: string
    subject: string
    predicate?: string
    object?: string
    sentiment?: SentimentTag
  }
}

const EXTRACTION_PATTERNS: ExtractionPattern[] = [
  /* ─── IDENTITY: name ─────────────────────────────────────────────── */
  {
    name: 'name',
    regex: /(?:my name is|i(?:'m| am) called|call me)\s+([a-z][a-z'-]{1,30})(?:\s+and|[.,!?\s]|$)/i,
    type: 'identity',
    importance: 0.95,
    buildContent: (m) => {
      const name = titleCase(m[1])
      return {
        content: `User's name is ${name}`,
        subject: 'user',
        predicate: 'named',
        object: name,
      }
    },
  },

  /* ─── LOCATION ───────────────────────────────────────────────────── */
  {
    name: 'location',
    regex: /i\s+(?:live|living|reside|residing|am\s+based|am\s+from)\s+(?:in|at)\s+([a-z][a-z\s,]{2,50}?)(?=[.,!?]|\s+and|\s+but|$)/i,
    type: 'fact',
    importance: 0.9,
    buildContent: (m) => {
      const location = titleCase(m[1])
      return {
        content: `User lives in ${location}`,
        subject: 'user',
        predicate: 'lives_in',
        object: location,
      }
    },
  },

  /* ─── LOCATION: "i'm in X" shorthand ─────────────────────────────── */
  {
    name: 'location_short',
    regex: /i(?:'m| am)\s+in\s+([a-z][a-z\s,]{2,50}?)(?=[.,!?]|\s+and|\s+but|$)/i,
    type: 'fact',
    importance: 0.75,
    buildContent: (m) => {
      const location = titleCase(m[1])
      return {
        content: `User is in ${location}`,
        subject: 'user',
        predicate: 'lives_in',
        object: location,
      }
    },
  },

  /* ─── WORK: employer ─────────────────────────────────────────────── */
  {
    name: 'employer',
    regex: /i(?:'m| am)?\s*(?:work(?:ing)?|employed)\s+(?:at|for|with)\s+([a-z0-9][a-z0-9\s&.\-]{1,40}?)(?=[.,!?]|\s+as|\s+and|$)/i,
    type: 'relationship',
    importance: 0.85,
    buildContent: (m) => {
      const company = cleanValue(m[1])
      return {
        content: `User works at ${company}`,
        subject: 'user',
        predicate: 'works_at',
        object: company,
      }
    },
  },

  /* ─── PROFESSION / ROLE ──────────────────────────────────────────── */
  {
    name: 'profession',
    regex: /i(?:'m| am)\s+(?:a|an)\s+([a-z][a-z\s]{2,40}?)(?=[.,!?]|\s+at|\s+for|\s+and|\s+in|$)/i,
    type: 'identity',
    importance: 0.8,
    buildContent: (m) => {
      const role = cleanValue(m[1])
      return {
        content: `User is a ${role}`,
        subject: 'user',
        predicate: 'is',
        object: role,
      }
    },
  },

  /* ─── LOVE / ENJOY ───────────────────────────────────────────────── */
  {
    name: 'loves',
    regex: /i\s+(?:really\s+|absolutely\s+)?(?:love|adore|enjoy)\s+([a-z][^.!?]{2,80}?)(?=[.,!?]|$)/i,
    type: 'preference',
    importance: 0.75,
    buildContent: (m) => {
      const thing = cleanValue(m[1])
      return {
        content: `User loves ${thing}`,
        subject: 'user',
        predicate: 'loves',
        object: thing,
        sentiment: 'positive',
      }
    },
  },

  /* ─── LIKE / PREFER ──────────────────────────────────────────────── */
  {
    name: 'likes',
    regex: /i\s+(?:really\s+)?(?:like|prefer|favor)\s+([a-z][^.!?]{2,80}?)(?=[.,!?]|$)/i,
    type: 'preference',
    importance: 0.65,
    buildContent: (m) => {
      const thing = cleanValue(m[1])
      return {
        content: `User likes ${thing}`,
        subject: 'user',
        predicate: 'likes',
        object: thing,
        sentiment: 'positive',
      }
    },
  },

  /* ─── DISLIKE / HATE ─────────────────────────────────────────────── */
  {
    name: 'dislikes',
    regex: /i\s+(?:really\s+|absolutely\s+)?(?:hate|dislike|can(?:'|no)?t\s+stand|don(?:'|no)?t\s+like)\s+([a-z][^.!?]{2,80}?)(?=[.,!?]|$)/i,
    type: 'preference',
    importance: 0.75,
    buildContent: (m) => {
      const thing = cleanValue(m[1])
      return {
        content: `User dislikes ${thing}`,
        subject: 'user',
        predicate: 'dislikes',
        object: thing,
        sentiment: 'negative',
      }
    },
  },

  /* ─── SKILLS ─────────────────────────────────────────────────────── */
  {
    name: 'skills',
    regex: /i(?:'m| am)?\s+(?:know|good\s+at|skilled\s+in|experienced\s+with|proficient\s+in)\s+([a-z][^.!?]{2,60}?)(?=[.,!?]|$)/i,
    type: 'skill',
    importance: 0.7,
    buildContent: (m) => {
      const skill = cleanValue(m[1])
      return {
        content: `User knows ${skill}`,
        subject: 'user',
        predicate: 'knows',
        object: skill,
      }
    },
  },

  /* ─── LEARNING ───────────────────────────────────────────────────── */
  {
    name: 'learning',
    regex: /i(?:'m| am)\s+(?:learning|studying|trying\s+to\s+learn)\s+([a-z][^.!?]{2,60}?)(?=[.,!?]|$)/i,
    type: 'goal',
    importance: 0.75,
    buildContent: (m) => {
      const subject = cleanValue(m[1])
      return {
        content: `User is learning ${subject}`,
        subject: 'user',
        predicate: 'learning',
        object: subject,
      }
    },
  },

  /* ─── GOALS ──────────────────────────────────────────────────────── */
  {
    name: 'goals',
    regex: /(?:my\s+goal\s+(?:is\s+)?to|i\s+want\s+to|i(?:'m| am)\s+trying\s+to)\s+([a-z][^.!?]{2,80}?)(?=[.,!?]|$)/i,
    type: 'goal',
    importance: 0.8,
    buildContent: (m) => {
      const goal = cleanValue(m[1])
      return {
        content: `User's goal: ${goal}`,
        subject: 'user',
        predicate: 'wants',
        object: goal,
      }
    },
  },

  /* ─── RELATIONSHIPS ──────────────────────────────────────────────── */
  {
    name: 'relationships',
    regex: /my\s+(wife|husband|partner|spouse|girlfriend|boyfriend|son|daughter|mom|mother|dad|father|brother|sister|friend|colleague|boss|manager)(?:'s\s+name)?\s+(?:is\s+|called\s+|named\s+)?([a-z][a-z'-]{1,30})/i,
    type: 'relationship',
    importance: 0.85,
    buildContent: (m) => {
      const relation = m[1].toLowerCase()
      const name = titleCase(m[2])
      return {
        content: `User's ${relation} is ${name}`,
        subject: 'user',
        predicate: `has_${relation}`,
        object: name,
      }
    },
  },

  /* ─── BIRTHDAY (sensitive) ───────────────────────────────────────── */
  {
    name: 'birthday',
    regex: /my\s+birthday(?:'s| is)\s+(?:on\s+)?([^.!?]{3,40}?)(?=[.,!?]|$)/i,
    type: 'fact',
    importance: 0.9,
    buildContent: (m) => {
      const date = cleanValue(m[1])
      return {
        content: `User's birthday is ${date}`,
        subject: 'user',
        predicate: 'born_on',
        object: date,
        sentiment: 'sensitive',
      }
    },
  },

  /* ─── AGE ────────────────────────────────────────────────────────── */
  {
    name: 'age',
    regex: /i(?:'m| am)\s+(\d{1,3})\s+years?\s+old/i,
    type: 'fact',
    importance: 0.85,
    buildContent: (m) => {
      const age = m[1]
      return {
        content: `User is ${age} years old`,
        subject: 'user',
        predicate: 'age',
        object: age,
        sentiment: 'sensitive',
      }
    },
  },

  /* ─── PETS ───────────────────────────────────────────────────────── */
  {
    name: 'pets',
    regex: /(?:i\s+have|my)\s+(?:a\s+)?(dog|cat|pet|bird|fish|rabbit|hamster)\s+(?:named|called)\s+([a-z][a-z'-]{1,30})/i,
    type: 'relationship',
    importance: 0.7,
    buildContent: (m) => {
      const pet = m[1].toLowerCase()
      const name = titleCase(m[2])
      return {
        content: `User has a ${pet} named ${name}`,
        subject: 'user',
        predicate: `has_${pet}`,
        object: name,
      }
    },
  },

  /* ─── FAVORITE X ─────────────────────────────────────────────────── */
  {
    name: 'favorite',
    regex: /my\s+favou?rite\s+([a-z\s]{2,25}?)\s+(?:is|are)\s+([a-z][^.!?]{1,60}?)(?=[.,!?]|$)/i,
    type: 'preference',
    importance: 0.75,
    buildContent: (m) => {
      const category = cleanValue(m[1])
      const value = cleanValue(m[2])
      return {
        content: `User's favorite ${category} is ${value}`,
        subject: 'user',
        predicate: `favorite_${category.replace(/\s+/g, '_')}`,
        object: value,
        sentiment: 'positive',
      }
    },
  },

  /* ─── OPINIONS ───────────────────────────────────────────────────── */
  {
    name: 'opinion',
    regex: /(?:i\s+think|in\s+my\s+opinion|i\s+believe)\s+(?:that\s+)?([a-z][^.!?]{3,100}?)(?=[.,!?]|$)/i,
    type: 'opinion',
    importance: 0.45,
    buildContent: (m) => {
      const opinion = cleanValue(m[1])
      return {
        content: `User thinks: ${opinion}`,
        subject: 'user',
        predicate: 'thinks',
        object: opinion,
      }
    },
  },
]

/* ═══════════════════════════════════════════════════════════════════════════════
   STOPWORDS
   ═══════════════════════════════════════════════════════════════════════════════ */

const STOPWORDS = new Set([
  'a','an','and','are','as','at','be','but','by','for','from','has','have',
  'he','in','is','it','its','of','on','or','she','that','the','this','to',
  'was','were','will','with','you','your','i','me','my','we','our','they',
  'them','their','what','which','who','when','where','why','how','can',
  'could','should','would','may','might','must','shall','do','does','did',
])

/* ═══════════════════════════════════════════════════════════════════════════════
   MEMORY SYSTEM
   ═══════════════════════════════════════════════════════════════════════════════ */

export class MemorySystem {
  private memories: Map<string, MemoryItem> = new Map()
  private entities: Map<string, Entity> = new Map()
  private maxMemories: number
  private minImportance: number
  private decayRate: number
  private enablePersistence: boolean
  private storageKey: string
  private userId?: string
  private saveTimer: ReturnType<typeof setTimeout> | null = null

  private listeners: Set<(memories: MemoryItem[]) => void> = new Set()

  constructor(options: MemoryOptions = {}) {
    this.maxMemories       = options.maxMemories ?? 200
    this.minImportance     = options.minImportance ?? 0.2
    this.decayRate         = options.decayRate ?? 0.01
    this.enablePersistence = options.enablePersistence ?? true
    this.storageKey        = options.storageKey ?? 'pulse:memory'
    this.userId            = options.userId

    if (this.enablePersistence && typeof window !== 'undefined') {
      this.load()
    }
  }

  /* ─── SUBSCRIBERS ───────────────────────────────────────────────── */
  subscribe(listener: (memories: MemoryItem[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    const all = this.getAllMemories()
    this.listeners.forEach((l) => l(all))
  }

  /* ─── CORE CRUD ─────────────────────────────────────────────────── */
  addMemory(
    item: Partial<MemoryItem> & Pick<MemoryItem, 'type' | 'content'>
  ): MemoryItem {
    const now = new Date()
    const id = item.id ?? this.generateId(item.content, item.subject ?? 'user')

    const existing = this.memories.get(id)

    if (existing) {
      const updated: MemoryItem = {
        ...existing,
        ...item,
        id,
        importance: Math.min(1, existing.importance + 0.05),
        accessCount: existing.accessCount + 1,
        lastAccessed: now,
        timestamp: existing.timestamp,
      }
      this.memories.set(id, updated)
      this.linkEntities(updated)
      this.schedulePersist()
      this.notify()
      return updated
    }

    const memory: MemoryItem = {
      id,
      type: item.type,
      content: item.content,
      subject: item.subject ?? 'user',
      predicate: item.predicate,
      object: item.object,
      timestamp: now,
      lastAccessed: now,
      accessCount: 0,
      importance: item.importance ?? 0.5,
      confidence: item.confidence ?? 'certain',
      sentiment: item.sentiment,
      source: item.source,
      entities: item.entities ?? this.extractEntities(item.content),
      tags: item.tags,
      expiresAt: item.expiresAt,
      linkedIds: item.linkedIds ?? [],
      metadata: item.metadata,
    }

    this.memories.set(id, memory)
    this.linkEntities(memory)
    this.enforceLimit()
    this.schedulePersist()
    this.notify()

    return memory
  }

  updateMemory(id: string, updates: Partial<MemoryItem>): MemoryItem | null {
    const existing = this.memories.get(id)
    if (!existing) return null

    const updated = { ...existing, ...updates, lastAccessed: new Date() }
    this.memories.set(id, updated)
    this.schedulePersist()
    this.notify()
    return updated
  }

  deleteMemory(id: string): boolean {
    const deleted = this.memories.delete(id)
    if (deleted) {
      this.entities.forEach((entity) => {
        entity.memoryIds = entity.memoryIds.filter((mid) => mid !== id)
      })
      this.schedulePersist()
      this.notify()
    }
    return deleted
  }

  clearMemories(): void {
    this.memories.clear()
    this.entities.clear()
    this.schedulePersist()
    this.notify()
  }

  forgetByType(type: MemoryType): number {
    let count = 0
    this.memories.forEach((mem, id) => {
      if (mem.type === type) {
        this.memories.delete(id)
        count++
      }
    })
    if (count > 0) {
      this.schedulePersist()
      this.notify()
    }
    return count
  }

  /* ─── SEARCH & RETRIEVAL ─────────────────────────────────────────── */
  search(query: string, options: SearchOptions = {}): MemoryItem[] {
    const {
      limit = 10,
      types,
      minImportance = this.minImportance,
      minConfidence,
      includeSensitive = true,
      boostRecent = true,
    } = options

    if (!query.trim() || this.memories.size === 0) return []

    const queryTokens = this.tokenize(query)
    if (queryTokens.length === 0) return []

    const confidenceRank: Record<Confidence, number> = { guessed: 1, inferred: 2, certain: 3 }
    const minConfRank = minConfidence ? confidenceRank[minConfidence] : 0

    const results = Array.from(this.memories.values())
      .filter((mem) => {
        if (mem.importance < minImportance) return false
        if (types && !types.includes(mem.type)) return false
        if (!includeSensitive && mem.sentiment === 'sensitive') return false
        if (confidenceRank[mem.confidence] < minConfRank) return false
        if (mem.expiresAt && mem.expiresAt < new Date()) return false
        return true
      })
      .map((mem) => ({
        memory: mem,
        score: this.calculateRelevance(mem, queryTokens, boostRecent),
      }))
      .filter((r) => r.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => {
        r.memory.accessCount++
        r.memory.lastAccessed = new Date()
        return r.memory
      })

    if (results.length > 0) this.schedulePersist()
    return results
  }

  getMemoriesAbout(entityName: string): MemoryItem[] {
    const entity = this.findEntity(entityName)
    if (!entity) return []
    return entity.memoryIds
      .map((id) => this.memories.get(id))
      .filter((m): m is MemoryItem => !!m)
      .sort((a, b) => b.importance - a.importance)
  }

  getAllMemories(): MemoryItem[] {
    return Array.from(this.memories.values()).sort((a, b) => {
      const scoreA = a.importance + this.recencyBoost(a.lastAccessed)
      const scoreB = b.importance + this.recencyBoost(b.lastAccessed)
      return scoreB - scoreA
    })
  }

  getMemoriesByType(type: MemoryType): MemoryItem[] {
    return Array.from(this.memories.values())
      .filter((m) => m.type === type)
      .sort((a, b) => b.importance - a.importance)
  }

  getCoreMemories(limit = 10): MemoryItem[] {
    return this.getAllMemories()
      .filter((m) => m.importance >= 0.7)
      .slice(0, limit)
  }

  /* ─── CONTEXT GENERATION FOR AI ──────────────────────────────────── */
  getContextualPrompt(options: { verbose?: boolean } = {}): string {
    const identity  = this.getMemoriesByType('identity').slice(0, 5)
    const facts     = this.getMemoriesByType('fact').slice(0, 5)
    const prefs     = this.getMemoriesByType('preference').slice(0, 8)
    const skills    = this.getMemoriesByType('skill').slice(0, 5)
    const goals     = this.getMemoriesByType('goal').slice(0, 3)
    const relations = this.getMemoriesByType('relationship').slice(0, 5)

    const sections: string[] = []

    if (identity.length > 0) {
      sections.push(
        `## Who they are\n${identity.map((m) => `• ${m.content}`).join('\n')}`
      )
    }

    if (facts.length > 0) {
      sections.push(
        `## Personal facts\n${facts.map((m) => `• ${m.content}`).join('\n')}`
      )
    }

    if (relations.length > 0) {
      sections.push(
        `## Relationships\n${relations.map((m) => `• ${m.content}`).join('\n')}`
      )
    }

    if (prefs.length > 0) {
      sections.push(
        `## Preferences\n${prefs.map((m) => `• ${m.content}`).join('\n')}`
      )
    }

    if (skills.length > 0) {
      sections.push(
        `## Skills & expertise\n${skills.map((m) => `• ${m.content}`).join('\n')}`
      )
    }

    if (goals.length > 0) {
      sections.push(
        `## Current goals\n${goals.map((m) => `• ${m.content}`).join('\n')}`
      )
    }

    if (sections.length === 0) return ''

    const header = options.verbose
      ? '## User memory profile\nThe following facts about the user have been remembered from prior conversations. Use them naturally to personalize responses without explicitly mentioning that you "remember" them unless asked.\n'
      : '## User context\n'

    return header + '\n' + sections.join('\n\n')
  }

  getRelevantContext(currentMessage: string, limit = 5): string {
    const relevant = this.search(currentMessage, { limit, boostRecent: true })
    if (relevant.length === 0) return ''
    return `Relevant memories for this message:\n${relevant.map((m) => `• ${m.content}`).join('\n')}`
  }

  /* ─── MESSAGE PROCESSING ─────────────────────────────────────────── */
  processMessage(message: string, source?: string): MemoryItem[] {
    if (!message || message.length < 3) return []

    const added: MemoryItem[] = []
    const normalizedMsg = message.trim()

    for (const pattern of EXTRACTION_PATTERNS) {
      const match = normalizedMsg.match(pattern.regex)
      if (match) {
        try {
          const built = pattern.buildContent(match)
          const memory = this.addMemory({
            type: pattern.type,
            importance: pattern.importance,
            confidence: 'certain',
            source,
            ...built,
          })
          added.push(memory)
          console.log(
            `🧠 [Memory:${pattern.name}] "${built.content}"`
          )
        } catch (e) {
          console.warn(`[Memory:${pattern.name}] Extraction error:`, e)
        }
      }
    }

    if (normalizedMsg.length > 30 && added.length === 0) {
      const summary = this.summarizeMessage(normalizedMsg)
      const memory = this.addMemory({
        type: 'conversation',
        content: summary,
        subject: 'user',
        importance: 0.25,
        confidence: 'inferred',
        source,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      added.push(memory)
    }

    return added
  }

  /* ─── DECAY & MAINTENANCE ────────────────────────────────────────── */
  applyDecay(): void {
    const now = Date.now()
    const toDelete: string[] = []

    this.memories.forEach((mem, id) => {
      if (mem.expiresAt && mem.expiresAt.getTime() < now) {
        toDelete.push(id)
        return
      }

      const daysSinceAccess = (now - mem.lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
      const accessBoost = Math.log10(mem.accessCount + 1) * 0.05
      const decay = this.decayRate * daysSinceAccess - accessBoost

      mem.importance = Math.max(0, mem.importance - decay)

      if (
        mem.importance < 0.05 &&
        mem.type !== 'identity' &&
        mem.confidence !== 'certain'
      ) {
        toDelete.push(id)
      }
    })

    toDelete.forEach((id) => this.memories.delete(id))
    if (toDelete.length > 0) {
      this.schedulePersist()
      this.notify()
    }
  }

  consolidate(): number {
    const groups = new Map<string, MemoryItem[]>()

    this.memories.forEach((mem) => {
      const key = `${mem.subject}:${mem.predicate ?? 'null'}:${mem.object ?? 'null'}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(mem)
    })

    let consolidated = 0
    groups.forEach((group) => {
      if (group.length <= 1) return

      const primary = group.reduce((a, b) => (a.importance > b.importance ? a : b))
      const others = group.filter((m) => m.id !== primary.id)

      primary.importance = Math.min(1, primary.importance + others.length * 0.05)
      primary.accessCount += others.reduce((sum, m) => sum + m.accessCount, 0)

      others.forEach((m) => this.memories.delete(m.id))
      consolidated += others.length
    })

    if (consolidated > 0) {
      this.schedulePersist()
      this.notify()
    }
    return consolidated
  }

  /* ─── ENTITY MANAGEMENT ──────────────────────────────────────────── */
  private linkEntities(memory: MemoryItem): void {
    if (!memory.entities?.length) return

    memory.entities.forEach((name) => {
      const key = name.toLowerCase()
      let entity = this.entities.get(key)

      if (!entity) {
        entity = {
          id: this.hash(key),
          name,
          type: this.inferEntityType(name),
          aliases: [],
          memoryIds: [],
          firstMentioned: new Date(),
          lastMentioned: new Date(),
          mentionCount: 0,
        }
        this.entities.set(key, entity)
      }

      if (!entity.memoryIds.includes(memory.id)) {
        entity.memoryIds.push(memory.id)
      }
      entity.lastMentioned = new Date()
      entity.mentionCount++
    })
  }

  findEntity(name: string): Entity | null {
    return this.entities.get(name.toLowerCase()) ?? null
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values()).sort(
      (a, b) => b.mentionCount - a.mentionCount
    )
  }

  private extractEntities(text: string): string[] {
    const matches = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) ?? []
    return Array.from(new Set(matches))
  }

  private inferEntityType(name: string): Entity['type'] {
    const lower = name.toLowerCase()
    if (/(inc|corp|llc|ltd|company)$/.test(lower)) return 'organization'
    if (/^(new york|london|paris|berlin|tokyo|.+ (city|street))/.test(lower)) return 'place'
    if (/(project|app)$/.test(lower)) return 'project'
    return 'thing'
  }

  /* ─── STATS ──────────────────────────────────────────────────────── */
  getStats(): MemoryStats {
    const memories = Array.from(this.memories.values())

    const byType = memories.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    }, {} as Record<MemoryType, number>)

    const bySentiment = memories.reduce((acc, m) => {
      if (m.sentiment) acc[m.sentiment] = (acc[m.sentiment] || 0) + 1
      return acc
    }, {} as Record<SentimentTag, number>)

    const averageImportance = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.importance, 0) / memories.length
      : 0

    const averageAccessCount = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.accessCount, 0) / memories.length
      : 0

    const timestamps = memories.map((m) => m.timestamp.getTime())
    const oldestMemory = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined
    const newestMemory = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined

    const bytes = JSON.stringify(this.exportData()).length
    const memoryUsage =
      bytes < 1024 ? `${bytes} B`
      : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`

    return {
      total: memories.length,
      byType,
      bySentiment,
      averageImportance,
      averageAccessCount,
      entities: this.entities.size,
      memoryUsage,
      oldestMemory,
      newestMemory,
    }
  }

  /* ─── PERSISTENCE ────────────────────────────────────────────────── */
  private schedulePersist(): void {
    if (!this.enablePersistence || typeof window === 'undefined') return
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.save(), 300)
  }

  save(): void {
    if (typeof window === 'undefined') return
    try {
      const data = this.exportData()
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (e) {
      console.warn('[Memory] Failed to persist:', e)
    }
  }

  load(): void {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(this.storageKey)
      if (!raw) return
      const data = JSON.parse(raw)
      this.importData(data)
      console.log(`🧠 [Memory] Loaded ${this.memories.size} memories from storage`)
    } catch (e) {
      console.warn('[Memory] Failed to load:', e)
    }
  }

  exportData() {
    return {
      version: 1,
      userId: this.userId,
      exportedAt: new Date().toISOString(),
      memories: Array.from(this.memories.values()).map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
        lastAccessed: m.lastAccessed.toISOString(),
        expiresAt: m.expiresAt?.toISOString(),
      })),
      entities: Array.from(this.entities.values()).map((e) => ({
        ...e,
        firstMentioned: e.firstMentioned.toISOString(),
        lastMentioned: e.lastMentioned.toISOString(),
      })),
    }
  }

  importData(data: any): void {
    if (!data?.memories) return

    this.memories.clear()
    this.entities.clear()

    data.memories.forEach((m: any) => {
      this.memories.set(m.id, {
        ...m,
        timestamp: new Date(m.timestamp),
        lastAccessed: new Date(m.lastAccessed),
        expiresAt: m.expiresAt ? new Date(m.expiresAt) : undefined,
      })
    })

    if (data.entities) {
      data.entities.forEach((e: any) => {
        this.entities.set(e.name.toLowerCase(), {
          ...e,
          firstMentioned: new Date(e.firstMentioned),
          lastMentioned: new Date(e.lastMentioned),
        })
      })
    }

    this.notify()
  }

  /* ─── PRIVATE HELPERS ────────────────────────────────────────────── */
  private enforceLimit(): void {
    if (this.memories.size <= this.maxMemories) return

    const sorted = Array.from(this.memories.entries())
      .sort(([, a], [, b]) => {
        const scoreA = a.importance + Math.log10(a.accessCount + 1) * 0.1
        const scoreB = b.importance + Math.log10(b.accessCount + 1) * 0.1
        return scoreA - scoreB
      })

    const toRemove = this.memories.size - this.maxMemories
    for (let i = 0; i < toRemove; i++) {
      if (sorted[i][1].type === 'identity' || sorted[i][1].sentiment === 'critical') continue
      this.memories.delete(sorted[i][0])
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  }

  private calculateRelevance(
    memory: MemoryItem,
    queryTokens: string[],
    boostRecent: boolean
  ): number {
    const contentTokens = this.tokenize(memory.content)
    if (contentTokens.length === 0) return 0

    let matches = 0
    for (const qt of queryTokens) {
      for (const ct of contentTokens) {
        if (ct === qt) { matches += 1; break }
        if (ct.includes(qt) || qt.includes(ct)) { matches += 0.5; break }
      }
    }
    let score = matches / queryTokens.length

    score *= 0.6 + memory.importance * 0.4
    score += Math.log10(memory.accessCount + 1) * 0.05

    if (boostRecent) {
      score += this.recencyBoost(memory.lastAccessed) * 0.1
    }

    const confMult: Record<Confidence, number> = { certain: 1, inferred: 0.85, guessed: 0.6 }
    score *= confMult[memory.confidence]

    return score
  }

  private recencyBoost(date: Date): number {
    const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, 1 - days / 30)
  }

  private summarizeMessage(msg: string): string {
    const firstSentence = msg.split(/[.!?]/)[0].trim()
    return firstSentence.length > 120
      ? firstSentence.slice(0, 120) + '…'
      : firstSentence
  }

  private generateId(content: string, subject: string): string {
    return this.hash(`${subject}::${content}`.toLowerCase())
  }

  private hash(input: string): string {
    return createHash('md5').update(input).digest('hex').slice(0, 16)
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SINGLETON
   ═══════════════════════════════════════════════════════════════════════════════ */

let _instance: MemorySystem | null = null

export function getMemorySystem(options?: MemoryOptions): MemorySystem {
  if (!_instance) {
    _instance = new MemorySystem(options)
    if (typeof window !== 'undefined') {
      setInterval(() => _instance?.applyDecay(), 60 * 60 * 1000)
    }
  }
  return _instance
}

export const memorySystem = getMemorySystem()