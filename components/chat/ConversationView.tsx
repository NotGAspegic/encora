// components/chat/ConversationView.tsx
'use client'

import { useChatStore } from '@/store/chatStore'
import { useMessages } from '@/hooks/useMessages'
import { useTyping } from '@/hooks/useTyping'
import { usePresence } from '@/hooks/usePresence'
import { useLastSeen } from '@/hooks/useLastSeen'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import type { Conversation, Profile } from '@/types'

const EMPTY_TYPING: string[] = []

interface ConversationViewProps {
  conversation: Conversation
  currentUser: Profile
  otherUser: Profile
}

export function ConversationView({
  conversation,
  currentUser,
  otherUser,
}: ConversationViewProps) {
  const { messages, sendMessage } = useMessages(
    conversation.id,
    currentUser.id,
    otherUser.id,
    otherUser.public_key
  )

  const { sendTyping } = useTyping(conversation.id, currentUser.id)
  const onlineUsers = useChatStore((s) => s.onlineUsers)
  usePresence(currentUser.id)
  useLastSeen(currentUser.id)

  const typingUsers = useChatStore(
    (s) => s.typingUsers[conversation.id] ?? EMPTY_TYPING
  )
  const isOtherUserTyping = typingUsers.includes(otherUser.id)
  const isOnline = onlineUsers.has(otherUser.id)

  return (
    <div className="flex flex-col h-screen bg-[#0c0e14]">
      <ChatHeader
        otherUser={otherUser}
        isOnline={isOnline}
        isTyping={isOtherUserTyping}
      />
      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        isOtherUserTyping={isOtherUserTyping}
        otherUsername={otherUser.username}
      />
      <MessageInput
        onSend={sendMessage}
        onTyping={sendTyping}
        disabled={!otherUser.public_key}
      />
    </div>
  )
}