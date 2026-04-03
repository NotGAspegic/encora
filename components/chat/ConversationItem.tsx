// components/chat/ConversationItem.tsx
'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot } from '@/components/ui/StatusDot'
import type { Conversation } from '@/types'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  isOnline: boolean
  currentConversationId?: string
}

export function ConversationItem({
  conversation,
  isActive,
  isOnline,
}: ConversationItemProps) {
  const other = conversation.other_user
  if (!other) return null

  const timeAgo = conversation.last_message?.created_at
    ? formatDistanceToNow(new Date(conversation.last_message.created_at), {
        addSuffix: false,
      })
    : null

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150
                  ${isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
    >
      <div className="relative shrink-0">
        <Avatar username={other.username} avatarUrl={other.avatar_url} size="md" />
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusDot isOnline={isOnline} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white truncate">
            @{other.username}
          </span>
          {timeAgo && (
            <span className="text-xs text-zinc-600 shrink-0 font-mono">{timeAgo}</span>
          )}
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">
          {conversation.last_message ? '🔒 encrypted message' : 'No messages yet'}
        </p>
      </div>
    </Link>
  )
}