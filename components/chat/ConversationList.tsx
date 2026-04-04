// components/chat/ConversationList.tsx
'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useConversations } from '@/hooks/useConversations'
import { useUnreadCounts } from '@/hooks/useUnreadCounts'
import { ConversationItem } from './ConversationItem'
import { UserSearch } from '@/components/ui/UserSearch'
import { SignOutButton } from '@/components/ui/SignOutButton'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '@/types'

interface ConversationListProps {
  currentUser: Profile
}

export function ConversationList({ currentUser }: ConversationListProps) {
  const params = useParams()
  const activeId = params?.conversationId as string | undefined
  const { onlineUsers, conversations } = useChatStore()

  useConversations(currentUser.id)

  // Stable array of conversation IDs for unread count subscription
  const conversationIds = useMemo(
    () => conversations.map((c) => c.id),
    [conversations.map((c) => c.id).join(',')]
  )

  useUnreadCounts(currentUser.id, conversationIds)

  // Total unread across all conversations for the page title
  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count ?? 0),
    0
  )

  return (
    <aside className="w-72 shrink-0 flex flex-col border-r border-white/[0.06]
                      bg-[#0a0c10] h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400
                            shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]" />
            <span className="font-mono text-xs text-emerald-400/80
                             tracking-widest uppercase">
              encora
            </span>
            {totalUnread > 0 && (
              <span className="text-xs font-mono text-emerald-400/60">
                ({totalUnread})
              </span>
            )}
          </div>
          <SignOutButton />
        </div>

        <div className="flex items-center gap-2.5 mb-4">
          <Avatar
            username={currentUser.username}
            avatarUrl={currentUser.avatar_url}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-xs text-zinc-400 font-mono truncate">
              @{currentUser.username}
            </p>
          </div>
        </div>

        <UserSearch currentUserId={currentUser.id} />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-zinc-600 font-mono leading-relaxed">
              Search for a user above to start your first encrypted conversation
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                isOnline={
                  conv.other_user
                    ? onlineUsers.has(conv.other_user.id)
                    : false
                }
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}