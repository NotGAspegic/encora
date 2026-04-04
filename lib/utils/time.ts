// lib/utils/time.ts
import { formatDistanceToNow, format, isToday, isYesterday, differenceInMinutes } from 'date-fns'

/**
 * Formats a timestamp for the conversation list sidebar.
 * - Same day: "14:32"
 * - Yesterday: "Yesterday"
 * - Older: "Mon", "Dec 12"
 */
export function formatConversationTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Yesterday'
  const now = new Date()
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (daysAgo < 7) return format(date, 'EEE') // "Mon", "Tue"
  return format(date, 'MMM d') // "Dec 12"
}

/**
 * Formats a timestamp for message separators inside a conversation.
 * - Same day: "14:32"
 * - Yesterday: "Yesterday at 14:32"
 * - Older: "Dec 12 at 14:32"
 */
export function formatMessageSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return `Yesterday at ${format(date, 'HH:mm')}`
  return format(date, 'MMM d \'at\' HH:mm')
}

/**
 * Formats last seen time for the chat header.
 * - Online now: handled by caller
 * - Within 1 hour: "last seen 23 minutes ago"
 * - Same day: "last seen at 14:32"
 * - Yesterday: "last seen yesterday at 14:32"
 * - Older: "last seen Dec 12"
 */
export function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return 'offline'
  const date = new Date(dateStr)
  const minutesAgo = differenceInMinutes(new Date(), date)
  if (minutesAgo < 1) return 'just now'
  if (minutesAgo < 60) return `last seen ${formatDistanceToNow(date, { addSuffix: false })} ago`
  if (isToday(date)) return `last seen at ${format(date, 'HH:mm')}`
  if (isYesterday(date)) return `last seen yesterday at ${format(date, 'HH:mm')}`
  return `last seen ${format(date, 'MMM d')}`
}

/**
 * Returns true if the user should be considered online.
 * We use a 35s window (heartbeat fires every 30s + 5s buffer).
 */
export function isRecentlyActive(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  const secondsAgo = (Date.now() - new Date(lastSeen).getTime()) / 1000
  return secondsAgo < 35
}

/**
 * Whether to show a separator between two consecutive messages.
 */
export function shouldShowSeparator(prevDateStr: string, currDateStr: string): boolean {
  const prev = new Date(prevDateStr)
  const curr = new Date(currDateStr)
  return differenceInMinutes(curr, prev) > 5
}