// hooks/useTyping.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

const TYPING_TIMEOUT_MS = 3000
const TYPING_THROTTLE_MS = 1000 // don't upsert more than once per second

export function useTyping(conversationId: string, currentUserId: string) {
  const supabase = createClient()
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSentRef = useRef<number>(0)
  const { setTypingUsers } = useChatStore()

  // Subscribe to typing changes from others
  useEffect(() => {
    if (!conversationId || !currentUserId) return

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          // Re-fetch current typers — more reliable than tracking individual events
          const cutoff = new Date(Date.now() - 5000).toISOString()
          const { data } = await supabase
            .from('typing_indicators')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', currentUserId)
            .gte('updated_at', cutoff)

          const typingIds = ((data ?? []) as { user_id: string }[]).map(
            (r) => r.user_id
          )
          setTypingUsers(conversationId, typingIds)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId, supabase, setTypingUsers])

  // Also clear our own typing indicator on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
      supabase
        .from('typing_indicators')
        .delete()
        .eq('user_id', currentUserId)
        .eq('conversation_id', conversationId)
        .then(() => {})
    }
  }, [conversationId, currentUserId, supabase])

  const sendTyping = useCallback(async () => {
    const now = Date.now()

    // Throttle — don't upsert on every keystroke
    if (now - lastSentRef.current < TYPING_THROTTLE_MS) {
      // Still reset the clear timeout so indicator stays alive
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
      clearTimeoutRef.current = setTimeout(async () => {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('user_id', currentUserId)
          .eq('conversation_id', conversationId)
        setTypingUsers(conversationId, [])
      }, TYPING_TIMEOUT_MS)
      return
    }

    lastSentRef.current = now

    await supabase.from('typing_indicators').upsert({
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
      setTypingUsers(conversationId, [])
    }, TYPING_TIMEOUT_MS)
  }, [conversationId, currentUserId, supabase, setTypingUsers])

  return { sendTyping }
}