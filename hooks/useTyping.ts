// hooks/useTyping.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

export function useTyping(conversationId: string, currentUserId: string) {
  const supabase = createClient()
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { setTypingUsers } = useChatStore()

  // Subscribe to typing events from the other user
  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          // Re-fetch who is currently typing
          const { data } = await supabase
            .from('typing_indicators')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', currentUserId)
            // Only show as typing if updated in the last 5 seconds
            .gte(
              'updated_at',
              new Date(Date.now() - 5000).toISOString()
            )

          const typingIds = (data ?? []).map((r: { user_id: string }) => r.user_id)
          setTypingUsers(conversationId, typingIds)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId, supabase, setTypingUsers])

  // Send typing indicator when the user types
  const sendTyping = useCallback(async () => {
    await supabase
      .from('typing_indicators')
      .upsert({
        user_id: currentUserId,
        conversation_id: conversationId,
        updated_at: new Date().toISOString(),
      })

if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
    clearTimeoutRef.current = setTimeout(async () => {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('user_id', currentUserId)
        .eq('conversation_id', conversationId)
    }, 3000)
  }, [conversationId, currentUserId, supabase])

  useEffect(() => () => {
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
  }, [])

  return { sendTyping }
}