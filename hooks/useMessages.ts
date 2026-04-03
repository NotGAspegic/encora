// hooks/useMessages.ts
'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { encryptMessage, decryptMessage } from '@/lib/crypto/encrypt'
import { deriveSharedKey } from '@/lib/crypto/keyDerivation'
import { getPrivateKey } from '@/lib/crypto/keys'
import { useChatStore } from '@/store/chatStore'
import { markMessagesAsRead } from '@/lib/supabase/queries'
import type { Message } from '@/types'

const EMPTY_MESSAGES: Message[] = []

export function useMessages(
  conversationId: string,
  currentUserId: string,
  otherUserId: string,
  otherUserPublicKey: string | null
) {
  const { setMessages, addMessage, updateMessage, updateConversationLastMessage } =
    useChatStore()

  // Cache the derived shared key for the duration of this hook's life
  const sharedKeyRef = useRef<CryptoKey | null>(null)

  const getSharedKey = useCallback(async (): Promise<CryptoKey> => {
    if (sharedKeyRef.current) return sharedKeyRef.current

    if (!otherUserPublicKey) {
      throw new Error(
        "The other user hasn't set up their encryption keys yet. " +
        'Ask them to sign in on their device first.'
      )
    }

    const privateKey = await getPrivateKey()
    if (!privateKey) {
      throw new Error(
        'Your encryption keys are missing from this device. ' +
        'Please sign out and sign back in to regenerate them.'
      )
    }

    const key = await deriveSharedKey(otherUserId, otherUserPublicKey)
    sharedKeyRef.current = key
    return key
  }, [otherUserId, otherUserPublicKey])

  // Decrypt a raw message row from Supabase
  const decryptRaw = useCallback(
    async (msg: Message): Promise<Message> => {
      try {
        const sharedKey = await getSharedKey()
        const plaintext = await decryptMessage(
          { ciphertext: msg.ciphertext, iv: msg.iv },
          sharedKey
        )
        return { ...msg, plaintext }
      } catch {
        return { ...msg, plaintext: '[message could not be decrypted]' }
      }
    },
    [getSharedKey]
  )

  // Load existing messages and set up realtime subscription
  useEffect(() => {
    if (!conversationId || !currentUserId) return

    const supabase = createClient()
    let cancelled = false

    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error || !data || cancelled) return

      const decrypted = await Promise.all((data as Message[]).map(decryptRaw))
      if (cancelled) return

      setMessages(conversationId, decrypted)
      await markMessagesAsRead(conversationId, currentUserId)
    }

    loadMessages()

    // Primary: Broadcast channel — instant, no RLS evaluation issues
    const broadcastChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'broadcast',
        { event: 'new_message' },
        async ({ payload }: { payload: Message }) => {
          if (cancelled) return
          // Ignore our own messages — already added optimistically
          if (payload.sender_id === currentUserId) return

          const existing = useChatStore.getState().messages[conversationId] ?? []
          if (existing.some((m) => m.id === payload.id)) return

          const decrypted = await decryptRaw(payload)
          addMessage(conversationId, decrypted)
          updateConversationLastMessage(conversationId, {
            ciphertext: payload.ciphertext,
            iv: payload.iv,
            created_at: payload.created_at,
          })
          await markMessagesAsRead(conversationId, currentUserId)
        }
      )
      .on(
        'broadcast',
        { event: 'messages_read' },
        ({ payload }: { payload: { message_ids: string[], read_at: string } }) => {
          if (cancelled) return
          // Update each message that was marked as read
          payload.message_ids.forEach((id) => {
            updateMessage(conversationId, id, { read_at: payload.read_at })
          })
        }
      )
      // Fallback: postgres_changes — catches messages from other devices/sessions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (cancelled) return
          const raw = payload.new as Message
          if (raw.sender_id === currentUserId) return

          const existing = useChatStore.getState().messages[conversationId] ?? []
          if (existing.some((m) => m.id === raw.id)) return

          const decrypted = await decryptRaw(raw)
          addMessage(conversationId, decrypted)
          updateConversationLastMessage(conversationId, {
            ciphertext: raw.ciphertext,
            iv: raw.iv,
            created_at: raw.created_at,
          })
          await markMessagesAsRead(conversationId, currentUserId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (cancelled) return
          const updated = payload.new as Message
          updateMessage(conversationId, updated.id, { read_at: updated.read_at })
        }
      )
      .subscribe((status, err) => {
        if (err) console.error('[Encora Realtime] error:', err)
        console.info('[Encora Realtime] status:', status)
      })

    return () => {
      cancelled = true
      supabase.removeChannel(broadcastChannel)
    }
  }, [
    conversationId,
    currentUserId,
    decryptRaw,
    setMessages,
    addMessage,
    updateMessage,
    updateConversationLastMessage,
  ])

  // Send an encrypted message
  const sendMessage = useCallback(
    async (plaintext: string): Promise<void> => {
      if (!plaintext.trim()) return

      const supabase = createClient()
      const sharedKey = await getSharedKey()
      const { ciphertext, iv } = await encryptMessage(plaintext.trim(), sharedKey)

      // Optimistic insert
      const optimisticId = `optimistic-${Date.now()}`
      const optimisticMessage: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        ciphertext,
        iv,
        plaintext: plaintext.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
      }
      addMessage(conversationId, optimisticMessage)

      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: currentUserId, ciphertext, iv })
        .select()
        .single<Message>()

      if (error) {
        useChatStore.getState().updateMessage(conversationId, optimisticId, {
          plaintext: '[failed to send]',
        })
        throw new Error(`Failed to send: ${error.message}`)
      }

      // Replace optimistic with real DB row
      useChatStore.setState((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
            m.id === optimisticId ? { ...data, plaintext: plaintext.trim() } : m
          ),
        },
      }))

      // Broadcast to the other user's channel — this is what makes receive instant
      await supabase.channel(`conversation:${conversationId}`).send({
        type: 'broadcast',
        event: 'new_message',
        payload: data, // encrypted payload — plaintext never sent over broadcast
      })
    },
    [conversationId, currentUserId, getSharedKey, addMessage]
  )

  const messages = useChatStore(
  (s) => s.messages[conversationId] ?? EMPTY_MESSAGES
  )

  return { messages, sendMessage }
}