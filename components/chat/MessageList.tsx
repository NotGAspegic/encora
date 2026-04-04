// components/chat/MessageList.tsx
'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { TypingBubble } from './TypingBubble'
import { shouldShowSeparator, formatMessageSeparator } from '@/lib/utils/time'
import type { Message } from '@/types'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isOtherUserTyping: boolean
  otherUsername: string
}

export function MessageList({
  messages,
  currentUserId,
  isOtherUserTyping,
  otherUsername,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isOtherUserTyping])

  if (messages.length === 0 && !isOtherUserTyping) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-500 text-sm">No messages yet.</p>
          <p className="text-zinc-600 text-xs font-mono">
            Messages are end-to-end encrypted.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
      <div className="flex flex-col gap-1.5">
        {messages.map((message, index) => (
          <div key={message.id}>
            {/* Time separator */}
            {(index === 0 ||
              shouldShowSeparator(
                messages[index - 1].created_at,
                message.created_at
              )) && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-zinc-600 font-mono shrink-0">
                  {formatMessageSeparator(message.created_at)}
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            )}
            <MessageBubble
              message={message}
              isOwn={message.sender_id === currentUserId}
            />
          </div>
        ))}

        {/* Typing bubble at the bottom */}
        {isOtherUserTyping && (
          <div className="mt-1">
            <TypingBubble username={otherUsername} />
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}