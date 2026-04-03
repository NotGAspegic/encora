// app/(app)/chat/[conversationId]/page.tsx — add the sidebar wrapper
import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ConversationList } from '@/components/chat/ConversationList'
import { ConversationView } from '@/components/chat/ConversationView'
import type { Profile, Conversation } from '@/types'

interface Props {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .single<Conversation>()

  if (!conversation) notFound()

  const otherUserId =
    conversation.participant_a === user.id
      ? conversation.participant_b
      : conversation.participant_a

  const [{ data: otherUser }, { data: currentUserProfile }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', otherUserId).single<Profile>(),
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
  ])

  if (!otherUser || !currentUserProfile) notFound()

  return (
    <div className="flex h-screen bg-[#0a0c10] overflow-hidden">
      <ConversationList currentUser={currentUserProfile} />

      <main className="flex-1 min-w-0">
        <ConversationView
          conversation={conversation}
          currentUser={currentUserProfile}
          otherUser={otherUser}
        />
      </main>
    </div>
  )
}