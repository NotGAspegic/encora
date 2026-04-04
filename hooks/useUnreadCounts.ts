// hooks/useUnreadCounts.ts
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

export function useUnreadCounts(currentUserId: string, conversationIds: string[]) {
  useEffect(() => {
    if (!currentUserId || conversationIds.length === 0) return

    const supabase = createClient()

    async function fetchCounts() {
      // Count unread messages per conversation in one query
      const { data } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', currentUserId)
        .is('read_at', null)

      if (!data) return

      // Tally per conversation
      const counts: Record<string, number> = {}
      for (const id of conversationIds) counts[id] = 0
      for (const row of data as { conversation_id: string }[]) {
        counts[row.conversation_id] = (counts[row.conversation_id] ?? 0) + 1
      }

      // Merge into conversations in the store
      useChatStore.setState((state) => ({
        conversations: state.conversations.map((c) => ({
          ...c,
          unread_count: counts[c.id] ?? 0,
        })),
      }))
    }

    fetchCounts()

    // Re-fetch whenever a message is updated (read_at changes)
    const channel = supabase
      .channel('unread-counts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => fetchCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, conversationIds.join(',')])
}