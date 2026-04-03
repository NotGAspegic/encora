// app/(app)/chat/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ConversationList } from '@/components/chat/ConversationList'
import { EmptyState } from '@/components/chat/EmptyState'
import { CryptoStatusBadge } from '@/components/ui/CryptoStatusBadge'
import type { Profile } from '@/types'

export default async function ChatPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  return (
    <div className="flex h-screen bg-[#0a0c10] overflow-hidden">
      <ConversationList currentUser={profile} />

      <main className="flex-1 flex flex-col">
        {/* Crypto init runs here — shown until keys are ready */}
        <div className="flex items-center justify-center h-full flex-col gap-4">
          <CryptoStatusBadge userId={user.id} />
          <EmptyState />
        </div>
      </main>
    </div>
  )
}