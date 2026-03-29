// app/(auth)/signup/page.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signUp } from '../actions'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)

    // Client-side pre-validation
    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
          <span className="font-mono text-xs tracking-[0.3em] text-emerald-400/80 uppercase">
            end-to-end encrypted
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Encora</h1>
        <p className="text-sm text-zinc-500 mt-1">Create your account</p>
      </div>

      {/* Card */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm shadow-xl shadow-black/40">
        <form action={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-mono">
                @
              </span>
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="yourname"
                pattern="[a-z0-9_]{3,24}"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3
                           text-white text-sm placeholder:text-zinc-600
                           focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06]
                           transition-all duration-200"
              />
            </div>
            <p className="text-xs text-zinc-600 font-mono">
              lowercase, letters, numbers, underscores · 3–24 chars
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                         text-white text-sm placeholder:text-zinc-600
                         focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06]
                         transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="min. 8 characters"
              minLength={8}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                         text-white text-sm placeholder:text-zinc-600
                         focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06]
                         transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono tracking-wider text-zinc-400 uppercase">
              Confirm password
            </label>
            <input
              name="confirm_password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="repeat your password"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                         text-white text-sm placeholder:text-zinc-600
                         focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06]
                         transition-all duration-200"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-400 text-xs mt-0.5">✕</span>
              <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {/* Security notice */}
          <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3">
            <span className="text-emerald-400 text-xs mt-0.5 shrink-0">🔒</span>
            <p className="text-emerald-400/70 text-xs leading-relaxed">
              Your encryption keys are generated on your device and never sent to our servers.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40
                       text-black font-semibold text-sm rounded-xl py-3.5
                       transition-all duration-200 disabled:cursor-not-allowed
                       shadow-[0_0_20px_rgba(52,211,153,0.25)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-xs text-zinc-600 font-mono">OR</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-zinc-600 mt-6 font-mono">
        Messages are encrypted before they leave your device.
      </p>
    </div>
  )
}