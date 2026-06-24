import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Landing point for Supabase auth email links (password recovery, etc.).
// Verifies the one-time token and, on success, opens a session via cookies set
// by the SSR client, then forwards the user to `next` (the reset form).
//
// Supports both delivery styles so it works regardless of the project's email
// template / flow configuration:
//   - token_hash + type  → verifyOtp   (recommended; cross-device safe)
//   - code               → exchangeCodeForSession (PKCE fallback)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/reset-password'

  const expired = encodeURIComponent('This reset link is invalid or has expired. Request a new one.')
  const failRedirect = new URL(`/forgot-password?error=${expired}`, request.url)

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) return NextResponse.redirect(new URL(next, request.url))
    return NextResponse.redirect(failRedirect)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, request.url))
    return NextResponse.redirect(failRedirect)
  }

  return NextResponse.redirect(
    new URL(`/forgot-password?error=${encodeURIComponent('Invalid reset link.')}`, request.url)
  )
}
