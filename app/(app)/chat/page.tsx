// app/(app)/chat/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import type { Profile } from '@/types'
import { CryptoStatusBadge } from '@/components/ui/CryptoStatusBadge'
import { SignOutButton } from '@/components/ui/SignOutButton'

export default async function ChatPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
        <span className="font-mono text-xs tracking-[0.3em] text-emerald-400/80 uppercase">
          connected · encrypted
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Encora</h1>
        <p className="text-zinc-500 text-sm">
          Welcome back,{' '}
          <span className="text-emerald-400 font-mono">@{profile?.username ?? user.email}</span>
        </p>
      </div>

      {/* Crypto init runs client-side — shows live key generation status */}
      <CryptoStatusBadge userId={user.id} />

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 max-w-sm w-full text-center space-y-3">
        <p className="text-zinc-400 text-sm">Auth ✓ · Crypto ✓ · DB (Day 3) · Chat UI (Day 4)</p>
        <p className="text-zinc-600 text-xs font-mono">
          Your private key is stored locally on this device only.
        </p>
      </div>
      <SignOutButton />
    </div>
  )
}