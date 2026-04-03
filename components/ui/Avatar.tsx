// components/ui/Avatar.tsx
interface AvatarProps {
  username: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

// Deterministic color from username
function colorFromUsername(username: string): string {
  const colors = [
    'bg-violet-500/20 text-violet-300',
    'bg-emerald-500/20 text-emerald-300',
    'bg-blue-500/20 text-blue-300',
    'bg-rose-500/20 text-rose-300',
    'bg-amber-500/20 text-amber-300',
    'bg-teal-500/20 text-teal-300',
  ]
  let hash = 0
  for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) % colors.length
  return colors[Math.abs(hash)]
}

export function Avatar({ username, avatarUrl, size = 'md' }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase()
  const color = colorFromUsername(username)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizes[size]} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center
                  font-mono font-medium shrink-0 select-none`}
    >
      {initials}
    </div>
  )
}