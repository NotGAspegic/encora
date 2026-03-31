// components/ui/CryptoStatusBadge.tsx
'use client'

import { useCryptoInit } from '@/hooks/useCryptoInit'

interface Props {
  userId: string
}

export function CryptoStatusBadge({ userId }: Props) {
  const { status, error } = useCryptoInit(userId)

  if (status === 'idle') return null

  if (status === 'generating') {
    return (
      <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5">
        <span className="w-3 h-3 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Generating encryption keys...</span>
      </div>
    )
  }

  if (status === 'uploading') {
    return (
      <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5">
        <span className="w-3 h-3 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Registering public key...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
        <span className="text-red-400 text-xs">✕</span>
        <span className="text-xs text-red-400 font-mono">{error}</span>
      </div>
    )
  }

  // ready
  return (
    <div className="flex items-center gap-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-2.5">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span className="text-xs text-emerald-400/80 font-mono">
        Encryption keys ready · Private key on this device only
      </span>
    </div>
  )
}