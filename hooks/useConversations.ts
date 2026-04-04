// hooks/useConversations.ts
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import type { Conversation, Profile, Message } from '@/types'


export function useConversations(currentUserId: string) {
  const { setConversations, setProfile, conversations } = useChatStore()

  useEffect(() => {
    if (!currentUserId) return

    const supabase = createClient()

    async function loadConversations() {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (error || !data) return

      const otherUserIds = data.map((c: Conversation) =>
        c.participant_a === currentUserId ? c.participant_b : c.participant_a
      )

      // Fetch other users' profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherUserIds)

      const profileMap: Record<string, Profile> = {}
      for (const p of profiles ?? []) {
        profileMap[(p as Profile).id] = p as Profile
      }

      // Fetch the latest message for each conversation
      const convIds = data.map((c: Conversation) => c.id)
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('conversation_id, ciphertext, iv, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })

      // Keep only the most recent message per conversation
      const lastMessageMap: Record<string, Pick<Message, 'ciphertext' | 'iv' | 'created_at'>> = {}
      for (const msg of (latestMessages ?? []) as (Pick<Message, 'ciphertext' | 'iv' | 'created_at'> & { conversation_id: string })[]) {
        if (!lastMessageMap[msg.conversation_id]) {
          lastMessageMap[msg.conversation_id] = {
            ciphertext: msg.ciphertext,
            iv: msg.iv,
            created_at: msg.created_at,
          }
        }
      }

      const enriched: Conversation[] = data.map((c: Conversation) => {
        const otherId =
          c.participant_a === currentUserId ? c.participant_b : c.participant_a
        const otherUser = profileMap[otherId]
        if (otherUser) setProfile(otherId, otherUser)
        return {
          ...c,
          other_user: otherUser,
          last_message: lastMessageMap[c.id] ?? undefined,
        }
      })

      // Sort by last message time, falling back to conversation creation time
      enriched.sort((a, b) => {
        const aTime = a.last_message?.created_at ?? a.created_at
        const bTime = b.last_message?.created_at ?? b.created_at
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      setConversations(enriched)
    }

    loadConversations()
  }, [currentUserId, setConversations, setProfile])

  return { conversations }
}