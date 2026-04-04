// components/ui/DynamicTitle.tsx
'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'

export function DynamicTitle() {
  const conversations = useChatStore((s) => s.conversations)

  useEffect(() => {
    const totalUnread = conversations.reduce(
      (sum, c) => sum + (c.unread_count ?? 0),
      0
    )
    document.title = totalUnread > 0
      ? `(${totalUnread}) Encora`
      : 'Encora'
  }, [conversations])

  return null
}