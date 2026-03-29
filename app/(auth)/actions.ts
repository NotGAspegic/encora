// app/(auth)/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  // Basic server-side validation
  if (!email || !password || !username) {
    return { error: 'All fields are required.' }
  }
  if (username.length < 3 || username.length > 24) {
    return { error: 'Username must be 3–24 characters.' }
  }
  if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
    return { error: 'Username can only contain letters, numbers, and underscores.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.toLowerCase() },
    },
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/chat')
}

export async function signIn(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/chat')
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}