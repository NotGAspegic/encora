// components/chat/ChatHeader.tsx
'use client'

import { Avatar } from '@/components/ui/Avatar'
import { StatusDot } from '@/components/ui/StatusDot'
import type { Profile } from '@/types'

interface ChatHeaderProps {
  otherUser: Profile
  isOnline: boolean
  isTyping: boolean
}

export function ChatHeader({ otherUser, isOnline, isTyping }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5
                    border-b border-white/[0.06] bg-[#0a0c10] shrink-0">
      <div className="relative">
        <Avatar username={otherUser.username} avatarUrl={otherUser.avatar_url} size="md" />
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusDot isOnline={isOnline} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">@{otherUser.username}</p>
        <p className="text-xs font-mono text-zinc-500">
          {isTyping ? (
            <span className="text-emerald-400/70">typing...</span>
          ) : isOnline ? (
            'online'
          ) : otherUser.last_seen ? (
            `last seen ${new Date(otherUser.last_seen).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          ) : (
            'offline'
          )}
        </p>
      </div>

      {/* Encryption indicator */}
      <div className="flex items-center gap-1.5 bg-emerald-500/5 border
                      border-emerald-500/15 rounded-lg px-2.5 py-1">
        <span className="text-emerald-400 text-xs">🔒</span>
        <span className="text-xs text-emerald-400/70 font-mono">E2E encrypted</span>
      </div>
    </div>
  )
}