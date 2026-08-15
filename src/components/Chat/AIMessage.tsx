/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Chat/AIMessage.tsx
'use client'

import { memo, useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { PulseRobot } from '@/components/Pulse/PulseRobot'
import { cn } from '@/utils/cn'

interface AIMessageProps {
  content: string
  model?: string
  timestamp?: string
  isStreaming?: boolean
  isError?: boolean  // Added this prop
  className?: string
}

interface CodeBlockProps {
  language?: string
  code: string
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function CodeBlock({ language = 'text', code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#06070b] shadow-inner">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500/40" />
            <span className="h-2 w-2 rounded-full bg-amber-500/40" />
            <span className="h-2 w-2 rounded-full bg-emerald-500/40" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/25">
            {language}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-mono text-white/35 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/70"
          aria-label="Copy code"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-emerald-400"
              >
                <CheckIcon />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <CopyIcon />
              </motion.span>
            )}
          </AnimatePresence>
          {copied ? 'copied' : 'copy'}
        </button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={tomorrow as any}
        PreTag="div"
        showLineNumbers
        wrapLongLines
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.8125rem',
          lineHeight: '1.65',
        }}
        lineNumberStyle={{
          color: 'rgba(255,255,255,0.14)',
          minWidth: '2rem',
          paddingRight: '1rem',
          userSelect: 'none',
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-7 text-white/72 last:mb-0">
      {children}
    </p>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-white/92">{children}</strong>
  ),

  em: ({ children }) => (
    <em className="italic text-white/78">{children}</em>
  ),

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-indigo-300 underline decoration-indigo-400/30 underline-offset-4 transition-colors hover:text-indigo-200 hover:decoration-indigo-300/60"
    >
      {children}
    </a>
  ),

  ul: ({ children }) => (
    <ul className="mb-3 ml-5 list-disc space-y-1.5 text-sm text-white/68 marker:text-white/25">
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1.5 text-sm text-white/68 marker:text-white/25">
      {children}
    </ol>
  ),

  li: ({ children }) => <li className="leading-7">{children}</li>,

  h1: ({ children }) => (
    <h1 className="mb-3 mt-1 text-xl font-bold tracking-tight text-white/95">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="mb-3 mt-4 text-lg font-bold tracking-tight text-white/92 first:mt-0">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-white/88 first:mt-0">
      {children}
    </h3>
  ),

  hr: () => <hr className="my-4 border-white/[0.08]" />,

  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-r-xl border-l-2 border-indigo-400/35 bg-indigo-500/[0.04] px-4 py-3 text-sm italic text-white/60">
      {children}
    </blockquote>
  ),

  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-2xl border border-white/[0.08]">
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-white/[0.03] text-white/70">{children}</thead>
  ),

  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/[0.06] text-white/55">
      {children}
    </tbody>
  ),

  tr: ({ children }) => <tr>{children}</tr>,

  th: ({ children }) => (
    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-4 py-2.5 align-top text-sm">{children}</td>
  ),

  pre: ({ children }) => <>{children}</>,

  code: ({ className, children }) => {
    const raw = String(children).replace(/\n$/, '')
    const match = /language-([\w-]+)/.exec(className || '')
    const isBlock = Boolean(match) || raw.includes('\n')

    if (isBlock) {
      return <CodeBlock language={match?.[1] ?? 'text'} code={raw} />
    }

    return (
      <code className="rounded-md border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-200">
        {children}
      </code>
    )
  },
}

export const AIMessage = memo(function AIMessage({
  content,
  model = 'GPT-4o',
  timestamp,
  isStreaming = false,
  isError = false,
  className,
}: AIMessageProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className={cn('flex gap-3', className)}
    >
      <div className="relative flex-shrink-0 pt-1">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 blur-xl" />
        <div 
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-2xl border",
            isError 
              ? "border-red-500/30 bg-red-500/10" 
              : "border-indigo-500/15 bg-[#0b0b12]"
          )}
        >
          <PulseRobot size="sm" />
        </div>

        <div className="absolute -bottom-0.5 -right-0.5">
          <span className={cn(
            "relative flex h-3 w-3",
            isError ? "text-red-400" : ""
          )}>
            <span className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
              isError ? "bg-red-400" : "bg-emerald-400"
            )} />
            <span className={cn(
              "relative inline-flex h-3 w-3 rounded-full border-2 border-[#050508]",
              isError ? "bg-red-400" : "bg-emerald-400"
            )} />
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className={cn(
          "relative overflow-hidden rounded-3xl rounded-tl-md border backdrop-blur-xl",
          isError 
            ? "border-red-500/20 bg-red-500/5" 
            : "border-white/[0.08] bg-[#0b0c11]/90"
        )}>
          <div className={cn(
            "absolute left-[14%] right-[14%] top-0 h-px bg-gradient-to-r from-transparent via- to-transparent",
            isError ? "via-red-500/40" : "via-indigo-500/40"
          )} />

          <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.01] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-1",
                isError 
                  ? "border-red-500/15 bg-red-500/8" 
                  : "border-indigo-500/15 bg-indigo-500/8"
              )}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
                    isError ? "bg-red-400" : "bg-indigo-400"
                  )} />
                  <span className={cn(
                    "relative inline-flex h-1.5 w-1.5 rounded-full",
                    isError ? "bg-red-400" : "bg-indigo-400"
                  )} />
                </span>
                <span className={cn(
                  "text-[10px] font-mono font-bold tracking-[0.15em]",
                  isError ? "text-red-300/85" : "text-indigo-300/85"
                )}>
                  PULSE_AI
                </span>
              </div>

              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-mono text-white/28">
                {model}
              </span>

              {isError && (
                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-mono font-semibold text-red-400">
                  error
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isStreaming && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-300/70">
                  <div className="flex gap-[3px]">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ scaleY: [0.5, 1.4, 0.5] }}
                        transition={{
                          duration: 0.7,
                          repeat: Infinity,
                          delay: i * 0.12,
                          ease: 'easeInOut',
                        }}
                        className="h-3 w-[2px] origin-bottom rounded-full bg-indigo-400"
                      />
                    ))}
                  </div>
                  generating
                </div>
              )}

              {timestamp && (
                <span className="text-[10px] font-mono text-white/18">
                  {timestamp}
                </span>
              )}
            </div>
          </div>

          <div className="px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="max-w-none">
              {isError ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-white/60">{content}</p>
                </div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-white/[0.05] pt-3">
              <span className="text-amber-400/80">
                <SparkIcon />
              </span>
              <span className="text-[10px] font-mono text-white/18">
                rendered markdown
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
})