// hooks/usePresence.ts
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import { PRESENCE_CHANNEL } from '@/lib/utils/presence'

interface PresenceState {
  userId: string
  online_at: string
}

export function usePresence(currentUserId: string) {
  const { setOnlineUsers, onlineUsers } = useChatStore()

  useEffect(() => {
    if (!currentUserId) return

    const supabase = createClient()

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: { key: currentUserId },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        // presenceState keys are the presence keys (userIds)
        const onlineIds = Object.keys(state)
        setOnlineUsers(onlineIds)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        // Optimistically add joining user
        const current = useChatStore.getState().onlineUsers
        const next = new Set(current)
        next.add(key)
        setOnlineUsers(Array.from(next))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        // Remove leaving user
        const current = useChatStore.getState().onlineUsers
        const next = new Set(current)
        next.delete(key)
        setOnlineUsers(Array.from(next))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUserId,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, setOnlineUsers])

  return { onlineUsers }
}