// types/index.ts

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
  // joined fields
  other_user?: Profile
  last_message?: {
    ciphertext: string
    created_at: string
  }
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  ciphertext: string
  iv: string
  read_at: string | null
  created_at: string
  // client-side only — never persisted
  plaintext?: string
}

export interface TypingIndicator {
  user_id: string
  conversation_id: string
  updated_at: string
}

export type AuthError = {
  message: string
}