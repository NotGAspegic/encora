// components/chat/UnreadBadge.tsx

interface UnreadBadgeProps {
  count: number
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count === 0) return null

  return (
    <span className="inline-flex items-center justify-center
                     min-w-[18px] h-[18px] px-1
                     bg-emerald-500 rounded-full
                     text-[10px] font-mono font-bold text-black
                     shadow-[0_0_8px_rgba(52,211,153,0.4)]">
      {count > 99 ? '99+' : count}
    </span>
  )
}