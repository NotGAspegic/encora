// components/chat/MessageBubble.tsx — full replacement

import { format } from 'date-fns'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const failed = message.plaintext === '[message could not be decrypted]'
  const pending = message.id.startsWith('optimistic-')

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                    ${isOwn
                      ? 'bg-emerald-500/20 border border-emerald-500/25 text-white rounded-br-sm'
                      : 'bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-bl-sm'
                    }
                    ${failed ? 'opacity-40 italic' : ''}
                    ${pending ? 'opacity-60' : ''}`}
      >
        <p className="break-words whitespace-pre-wrap">
          {message.plaintext ?? '…'}
        </p>
      </div>

      {/* Always show time + read receipt under every bubble */}
      <div className={`flex items-center gap-1 mt-0.5 px-1
                       ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-xs text-zinc-600 font-mono">
          {format(new Date(message.created_at), 'HH:mm')}
        </span>
        {isOwn && (
          <span className={`text-xs font-mono ${
            pending
              ? 'text-zinc-700'
              : message.read_at
              ? 'text-emerald-400'
              : 'text-zinc-500'
          }`}>
            {pending ? '○' : message.read_at ? '✓✓' : '✓'}
          </span>
        )}
      </div>
    </div>
  )
}