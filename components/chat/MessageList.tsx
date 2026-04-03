// components/chat/MessageList.tsx
'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import type { Message } from '@/types'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

// Show timestamp if more than 5 minutes have passed since the previous message
function shouldShowTimestamp(messages: Message[], index: number): boolean {
  if (index === 0) return true
  const prev = new Date(messages[index - 1].created_at).getTime()
  const curr = new Date(messages[index].created_at).getTime()
  return curr - prev > 5 * 60 * 1000
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-500 text-sm">No messages yet.</p>
          <p className="text-zinc-600 text-xs font-mono">
            Your messages are end-to-end encrypted.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
      <div className="flex flex-col gap-1.5">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === currentUserId}
            showTimestamp={shouldShowTimestamp(messages, index)}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}