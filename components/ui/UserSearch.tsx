// components/ui/UserSearch.tsx
'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from './Avatar'
import type { Profile } from '@/types'

interface UserSearchProps {
  currentUserId: string
}

export function UserSearch({ currentUserId }: UserSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const search = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!value.trim()) {
        setResults([])
        setIsOpen(false)
        return
      }
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true)
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${value}%`)
          .neq('id', currentUserId)
          .limit(8)

        setResults((data as Profile[]) ?? [])
        setIsOpen(true)
        setIsSearching(false)
      }, 300)
    },
    [currentUserId]
  )

  async function startConversation(otherUserId: string) {
    const supabase = createClient()
    const { data: convId } = await supabase.rpc('get_or_create_conversation', {
      user_a: currentUserId,
      user_b: otherUserId,
    })

    setQuery('')
    setResults([])
    setIsOpen(false)

    if (convId) router.push(`/chat/${convId}`)
  }

  return (
    <div className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
          ⌕
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            search(e.target.value)
          }}
          onFocus={() => query && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Search users..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                     pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600
                     focus:outline-none focus:border-emerald-500/40
                     transition-all duration-200"
        />
        {isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="w-3 h-3 border border-zinc-600 border-t-emerald-400
                             rounded-full animate-spin inline-block" />
          </span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50
                        bg-[#0f1117] border border-white/[0.08] rounded-xl
                        shadow-2xl shadow-black/60 overflow-hidden">
          {results.map((profile) => (
            <button
              key={profile.id}
              onMouseDown={() => startConversation(profile.id)}
              className="w-full flex items-center gap-3 px-4 py-3
                         hover:bg-white/[0.04] transition-colors text-left"
            >
              <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="sm" />
              <div>
                <p className="text-sm text-white font-medium">@{profile.username}</p>
                {!profile.public_key && (
                  <p className="text-xs text-amber-400/70 font-mono">
                    no encryption key yet
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50
                        bg-[#0f1117] border border-white/[0.08] rounded-xl
                        shadow-2xl shadow-black/60 px-4 py-3">
          <p className="text-xs text-zinc-500 font-mono">no users found for "{query}"</p>
        </div>
      )}
    </div>
  )
}