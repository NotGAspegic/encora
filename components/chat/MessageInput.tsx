// components/chat/MessageInput.tsx
'use client'

import { useState, useRef, useCallback } from 'react'

interface MessageInputProps {
  onSend: (text: string) => Promise<void>
  onTyping: () => void
  disabled?: boolean
}

export function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(async () => {
    if (!text.trim() || isSending || disabled) return
    const content = text.trim()
    setText('')
    setError(null)
    setIsSending(true)

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      await onSend(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send.')
      setText(content) // restore on failure
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }, [text, isSending, disabled, onSend])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    onTyping()
    // Auto-resize textarea
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div className="shrink-0 px-4 py-3 border-t border-white/[0.06]">
      {error && (
        <div className="mb-2 flex items-center gap-2 bg-red-500/10 border
                        border-red-500/20 rounded-xl px-3 py-2">
          <span className="text-red-400 text-xs">✕</span>
          <p className="text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 bg-white/[0.04] border border-white/[0.08]
                        rounded-2xl px-4 py-3 focus-within:border-emerald-500/40
                        transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder={disabled ? 'Encryption keys not ready...' : 'Message... (Enter to send)'}
            rows={1}
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600
                       resize-none focus:outline-none leading-relaxed
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '160px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending || disabled}
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400
                     disabled:bg-white/[0.06] disabled:text-zinc-600
                     text-black flex items-center justify-center shrink-0
                     transition-all duration-200
                     shadow-[0_0_16px_rgba(52,211,153,0.2)]
                     hover:shadow-[0_0_20px_rgba(52,211,153,0.35)]
                     disabled:shadow-none"
        >
          {isSending ? (
            <span className="w-3.5 h-3.5 border-2 border-black/30
                             border-t-black/80 rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-xs text-zinc-700 font-mono mt-2 text-center">
        shift+enter for new line · messages are end-to-end encrypted
      </p>
    </div>
  )
}