// components/ui/StatusDot.tsx
interface StatusDotProps {
  isOnline: boolean
  className?: string
}

export function StatusDot({ isOnline, className = '' }: StatusDotProps) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        isOnline
          ? 'bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]'
          : 'bg-zinc-600'
      } ${className}`}
    />
  )
}