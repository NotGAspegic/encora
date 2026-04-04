// components/chat/TypingBubble.tsx
'use client'

interface TypingBubbleProps {
  username: string
}

export function TypingBubble({ username }: TypingBubbleProps) {
  return (
    <div className="flex flex-col items-start">
      <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl
                      rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '1s' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '1s' }}
        />
      </div>
      <span className="text-xs text-zinc-600 font-mono mt-0.5 px-1">
        @{username} is typing
      </span>
    </div>
  )
}