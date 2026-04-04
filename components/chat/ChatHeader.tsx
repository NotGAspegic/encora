// components/chat/ChatHeader.tsx
'use client'

import { Avatar } from '@/components/ui/Avatar'
import { StatusDot } from '@/components/ui/StatusDot'
import { formatLastSeen } from '@/lib/utils/time'
import type { Profile } from '@/types'

interface ChatHeaderProps {
  otherUser: Profile
  isOnline: boolean
  isTyping: boolean
}

export function ChatHeader({ otherUser, isOnline, isTyping }: ChatHeaderProps) {
  function getSubtitle(): React.ReactNode {
    if (isTyping) {
      return <span className="text-emerald-400/80 animate-pulse">typing...</span>
    }
    if (isOnline) {
      return <span className="text-emerald-400/70">online</span>
    }
    return (
      <span className="text-zinc-500">
        {formatLastSeen(otherUser.last_seen)}
      </span>
    )
  }

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
        <p className="text-xs font-mono transition-all duration-300">
          {getSubtitle()}
        </p>
      </div>

      <div className="flex items-center gap-1.5 bg-emerald-500/5 border
                      border-emerald-500/15 rounded-lg px-2.5 py-1 shrink-0">
        <span className="text-emerald-400 text-xs">🔒</span>
        <span className="text-xs text-emerald-400/70 font-mono">E2E</span>
      </div>
    </div>
  )
}