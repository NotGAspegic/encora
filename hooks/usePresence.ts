// hooks/usePresence.ts
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

export function usePresence(currentUserId: string) {
  const { setOnlineUsers, onlineUsers } = useChatStore()

  useEffect(() => {
    if (!currentUserId) return

    const supabase = createClient()

    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUserId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ userId: string }>()
        const onlineIds = Object.keys(state)
        setOnlineUsers(onlineIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: currentUserId, online_at: new Date().toISOString() })
        }
      })

    // Update last_seen in the DB every 30 seconds
    const heartbeat = setInterval(async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentUserId)
    }, 30_000)

    return () => {
      clearInterval(heartbeat)
      supabase.removeChannel(channel)
    }
  }, [currentUserId, setOnlineUsers])

  return { onlineUsers }
}