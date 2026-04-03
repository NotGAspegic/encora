// hooks/useCryptoInit.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateAndStoreKeyPair, hasKeyPair, getPublicKeyJwk } from '@/lib/crypto'

export type CryptoInitStatus =
  | 'idle'
  | 'generating'
  | 'uploading'
  | 'ready'
  | 'error'

export interface CryptoInitState {
  status: CryptoInitStatus
  error: string | null
}

/**
 * Initializes the user's crypto identity on the current device.
 *
 * Flow:
 * 1. Check if a key pair exists in IndexedDB
 * 2. If not, generate a new ECDH P-256 key pair
 * 3. Upload the public key JWK to profiles.public_key in Supabase
 * 4. If a key pair already exists but the DB row is missing the public key, re-upload
 *
 * This hook is safe to run on every app load — it's idempotent.
 * It will not overwrite an existing key pair.
 */
export function useCryptoInit(userId: string | null) {
  const [state, setState] = useState<CryptoInitState>({
    status: 'idle',
    error: null,
  })

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function init() {
      setState({ status: 'generating', error: null })

      try {
        // This is idempotent — returns existing key if already in IndexedDB
        const publicKeyJwk = await generateAndStoreKeyPair()

        if (cancelled) return
        setState({ status: 'uploading', error: null })

        const supabase = createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('public_key')
          .eq('id', userId)
          .single()

        if (cancelled) return

        // Re-upload if Supabase has a different key than what's in IndexedDB
        // This handles the case where keys were cleared server-side or rotated
        if (!profile?.public_key || profile.public_key !== publicKeyJwk) {
          const { error } = await supabase
            .from('profiles')
            .update({ public_key: publicKeyJwk })
            .eq('id', userId)

          if (error) throw new Error(`Failed to upload public key: ${error.message}`)
          
          console.info('[Encora Crypto] Public key re-synced to Supabase.')
        }

        if (cancelled) return
        setState({ status: 'ready', error: null })
        console.info('[Encora Crypto] Crypto init complete ✓')
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Unknown crypto error'
        console.error('[Encora Crypto] Init failed:', message)
        setState({ status: 'error', error: message })
      }
    }

    init()
    return () => { cancelled = true }
  }, [userId])

  return state
}