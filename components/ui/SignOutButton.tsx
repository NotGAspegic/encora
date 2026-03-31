// components/ui/SignOutButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { clearKeyPair, clearSharedKeyCache } from '@/lib/crypto'
import { signOut } from '@/app/(auth)/actions'

export function SignOutButton() {
  async function handleSignOut() {
    // Clear crypto material from browser before the server redirect
    await clearKeyPair()
    clearSharedKeyCache()
    await signOut()
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-zinc-600 hover:text-zinc-400 font-mono transition-colors"
    >
      sign out →
    </button>
  )
}