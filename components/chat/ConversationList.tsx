// components/chat/ConversationList.tsx
'use client'

import { useParams } from 'next/navigation'
import { useChatStore } from '@/store/chatStore'
import { useConversations } from '@/hooks/useConversations'
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

  // Load conversations into the store
  useConversations(currentUser.id)

  return (
    <aside className="w-72 shrink-0 flex flex-col border-r border-white/[0.06]
                      bg-[#0a0c10] h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400
                            shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]" />
            <span className="font-mono text-xs text-emerald-400/80 tracking-widest uppercase">
              encora
            </span>
          </div>
          <SignOutButton />
        </div>

        {/* Current user */}
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
          <div className="text-center py-8">
            <p className="text-xs text-zinc-600 font-mono">
              Search for a user to start chatting
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