// components/chat/EmptyState.tsx
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 select-none">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06]
                      flex items-center justify-center text-2xl">
        🔒
      </div>
      <div className="text-center space-y-1">
        <p className="text-zinc-400 text-sm font-medium">Select a conversation</p>
        <p className="text-zinc-600 text-xs font-mono">
          or search for a user to start chatting
        </p>
      </div>
    </div>
  )
}