// types/index.ts — replace the full file

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  public_key: string | null
  last_seen: string | null
  created_at: string
}

export interface Conversation {
  id: string
  participant_a: string
  participant_b: string
  created_at: string
  // Joined fields — populated by queries that JOIN profiles
  other_user?: Profile
  last_message?: Pick<Message, 'ciphertext' | 'iv' | 'created_at'>
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  ciphertext: string
  iv: string
  read_at: string | null
  created_at: string
  // Client-side only — never persisted, never sent to server
  plaintext?: string
}

export interface TypingIndicator {
  user_id: string
  conversation_id: string
  updated_at: string
}

export type MessageInsert = Pick<Message, 'conversation_id' | 'sender_id' | 'ciphertext' | 'iv'>

export type AuthError = {
  message: string
}