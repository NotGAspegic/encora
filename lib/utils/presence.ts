// lib/utils/presence.ts

/**
 * Returns the canonical presence channel name for the whole app.
 * All users join this single channel so everyone can see who's online.
 */
export const PRESENCE_CHANNEL = 'encora:presence'

/**
 * Returns the broadcast channel name for a specific conversation.
 */
export function conversationChannel(conversationId: string): string {
  return `conversation:${conversationId}`
}

/**
 * Returns the typing channel name for a specific conversation.
 */
export function typingChannel(conversationId: string): string {
  return `typing:${conversationId}`
}