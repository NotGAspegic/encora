// components/chat/ConversationItem.tsx
'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { StatusDot } from '@/components/ui/StatusDot'
import { UnreadBadge } from './UnreadBadge'
import { formatConversationTime } from '@/lib/utils/time'
import type { Conversation } from '@/types'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  isOnline: boolean
}

export function ConversationItem({
  conversation,
  isActive,
  isOnline,
}: ConversationItemProps) {
  const other = conversation.other_user
  if (!other) return null

  const timeLabel = conversation.last_message?.created_at
    ? formatConversationTime(conversation.last_message.created_at)
    : null

  const unreadCount = conversation.unread_count ?? 0

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl
                  transition-all duration-150 group
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
          <span className={`text-sm truncate ${
            unreadCount > 0 ? 'font-semibold text-white' : 'font-medium text-zinc-200'
          }`}>
            @{other.username}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {timeLabel && (
              <span className={`text-xs font-mono ${
                unreadCount > 0 ? 'text-emerald-400/70' : 'text-zinc-600'
              }`}>
                {timeLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate font-mono ${
            unreadCount > 0 ? 'text-zinc-400' : 'text-zinc-600'
          }`}>
            {conversation.last_message
              ? `🔒 encrypted message`
              : 'No messages yet'}
          </p>
          <UnreadBadge count={unreadCount} />
        </div>
      </div>
    </Link>
  )
}