// hooks/useLastSeen.ts
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const HEARTBEAT_INTERVAL_MS = 30_000

export function useLastSeen(userId: string | null) {
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Update immediately on mount
    async function ping() {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId!)
    }

    ping()

    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS)

    // Mark offline on unload
    function handleUnload() {
      // Synchronous — must use sendBeacon or fetch keepalive
      // Supabase REST URL pattern
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`
      const body = JSON.stringify({ last_seen: new Date(0).toISOString() })
      navigator.sendBeacon(
        url,
        new Blob([body], { type: 'application/json' })
      )
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [userId])
}