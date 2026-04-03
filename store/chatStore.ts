// store/chatStore.ts
import { create } from 'zustand'
import type { Message, Conversation, Profile } from '@/types'

const EMPTY_CONVERSATIONS: Conversation[] = []

interface ChatStore {
  // Messages keyed by conversationId
  messages: Record<string, Message[]>
  // All conversations for the current user
  conversations: Conversation[]
  // Profiles cache keyed by userId
  profiles: Record<string, Profile>
  // Which users are currently typing, keyed by conversationId
  typingUsers: Record<string, string[]>
  // Which users are online (userId set)
  onlineUsers: Set<string>
  

  // Message actions
  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void

  // Conversation actions
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversationLastMessage: (
    conversationId: string,
    lastMessage: Pick<Message, 'ciphertext' | 'iv' | 'created_at'>
  ) => void

  // Profile actions
  setProfile: (userId: string, profile: Profile) => void

  // Presence actions
  setTypingUsers: (conversationId: string, userIds: string[]) => void
  setOnlineUsers: (userIds: string[]) => void

  // Reset on sign-out
  reset: () => void
}

const initialState = {
  messages: {},
  conversations: [],
  profiles: {},
  typingUsers: {},
  onlineUsers: new Set<string>(),
}

export const useChatStore = create<ChatStore>((set) => ({
  ...initialState,

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] ?? EMPTY_CONVERSATIONS
      // Deduplicate — realtime can fire twice in dev
      if (existing.some((m) => m.id === message.id)) return state
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      }
    }),

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? EMPTY_CONVERSATIONS).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => {
      if (state.conversations.some((c) => c.id === conversation.id)) return state
      return { conversations: [conversation, ...state.conversations] }
    }),

  updateConversationLastMessage: (conversationId, lastMessage) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, last_message: lastMessage } : c
      ),
    })),

  setProfile: (userId, profile) =>
    set((state) => ({
      profiles: { ...state.profiles, [userId]: profile },
    })),

  setTypingUsers: (conversationId, userIds) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [conversationId]: userIds },
    })),

  setOnlineUsers: (userIds) =>
    set((state) => {
      const next = new Set(userIds)
      // Skip update if contents are identical
      if (
        next.size === state.onlineUsers.size &&
        userIds.every((id) => state.onlineUsers.has(id))
      ) {
        return state
      }
      return { onlineUsers: next }
    }),

  reset: () => set(initialState),
}))