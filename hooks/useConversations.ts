// hooks/useConversations.ts
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import type { Conversation, Profile } from '@/types'

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

      // Fetch the other participant's profile for each conversation
      const otherUserIds = data.map((c: Conversation) =>
        c.participant_a === currentUserId ? c.participant_b : c.participant_a
      )

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherUserIds)

      const profileMap: Record<string, Profile> = {}
      for (const p of profiles ?? []) {
        profileMap[p.id] = p as Profile
      }

      // Merge other_user into each conversation
      const enriched: Conversation[] = data.map((c: Conversation) => {
        const otherId =
          c.participant_a === currentUserId ? c.participant_b : c.participant_a
        const otherUser = profileMap[otherId]
        if (otherUser) setProfile(otherId, otherUser)
        return { ...c, other_user: otherUser }
      })

      setConversations(enriched)
    }

    loadConversations()
  }, [currentUserId, setConversations, setProfile])

  return { conversations }
}