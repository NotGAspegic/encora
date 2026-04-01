// lib/supabase/queries.ts
// Typed wrappers around common Supabase queries used across the app

import { createClient } from './client'
import type { Conversation, Message, Profile } from '@/types'

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()

  if (error) {
    console.error('[Supabase] getProfile error:', error.message)
    return null
  }
  return data
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `%${query}%`)
    .limit(20)

  if (error) {
    console.error('[Supabase] searchProfiles error:', error.message)
    return []
  }
  return (data as Profile[]) ?? []
}

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * Fetch all conversations for the current user,
 * with the other participant's profile joined.
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      participant_a,
      participant_b,
      created_at
    `)
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Supabase] getConversations error:', error.message)
    return []
  }

  return (data as Conversation[]) ?? []
}

/**
 * Get or create a conversation between two users.
 * Uses the Postgres function to handle canonical UUID ordering.
 */
export async function getOrCreateConversation(
  userA: string,
  userB: string
): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    user_a: userA,
    user_b: userB,
  })

  if (error) {
    console.error('[Supabase] getOrCreateConversation error:', error.message)
    return null
  }

  return data as string
}

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * Fetch all messages for a conversation, ordered oldest first.
 * Returns raw encrypted payloads — decryption happens in the hook.
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[Supabase] getMessages error:', error.message)
    return []
  }

  return (data as Message[]) ?? []
}

/**
 * Insert an encrypted message.
 * ciphertext and iv must be base64 strings from encryptMessage().
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  ciphertext: string,
  iv: string
): Promise<Message | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      ciphertext,
      iv,
    })
    .select()
    .single<Message>()

  if (error) {
    console.error('[Supabase] sendMessage error:', error.message)
    return null
  }

  return data
}

/**
 * Mark all unread messages in a conversation as read.
 * Only marks messages sent by the OTHER user (not the current user's own messages).
 */
export async function markMessagesAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentUserId)
    .is('read_at', null)

  if (error) {
    console.error('[Supabase] markMessagesAsRead error:', error.message)
  }
}