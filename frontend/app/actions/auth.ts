'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendEmail, passwordResetEmailHtml } from '@/lib/email'

// Resolve the public origin of the current request (works locally and behind
// the Render proxy) so password-reset links point back to this same deployment.
async function getOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:2028'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

// Service-role client (bypasses RLS, has auth.admin access). Never exposed to the browser.
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// The Supabase project has "Confirm email" enabled, but this app has no
// email-verification flow (no callback route, no verification UI) — it is
// designed to take users straight from signup into onboarding. To honor that
// design we confirm the account server-side so a session can be established.
async function confirmUserByEmail(email: string): Promise<void> {
  try {
    const admin = serviceClient()
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const user = data?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (user && !user.email_confirmed_at) {
      await admin.auth.admin.updateUserById(user.id, { email_confirm: true })
    }
  } catch {
    // Non-fatal — sign-in will surface any real error to the user.
  }
}

function isEmailNotConfirmed(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message ?? '')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  let { error } = await supabase.auth.signInWithPassword({ email, password })

  // Existing accounts created while "Confirm email" was on can't sign in —
  // confirm them server-side and retry once.
  if (isEmailNotConfirmed(error)) {
    await confirmUserByEmail(email)
    ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
  }

  if (error) {
    redirect(`/signin?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  // Create the account via the admin API with the email pre-confirmed. The
  // browser-side anon signUp triggers Supabase's built-in confirmation email,
  // which (a) this app has no flow to handle and (b) has a strict hourly send
  // limit that makes signup fail with "over_email_send_rate_limit". The admin
  // API creates an already-confirmed user and sends no email.
  const { error } = await serviceClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    const msg = /already|registered|exists/i.test(error.message)
      ? 'An account with this email already exists — try signing in.'
      : error.message
    return { error: msg }
  }

  // Mark evaluator assessment as converted (fire-and-forget)
  const assessmentId = formData.get('assessment_id') as string | null
  if (assessmentId && email) {
    try {
      const db = serviceClient()
      await db
        .from('evaluator_assessments')
        .update({ converted_at: new Date().toISOString() })
        .eq('id', assessmentId)
        .eq('email', email)
    } catch {
      // Non-fatal — don't block signup
    }
  }

  // Establish a session so the user lands in onboarding directly.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    redirect(`/signin?error=${encodeURIComponent('Account created — please sign in.')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/signin')
}

// ── Password reset ───────────────────────────────────────────────────────────

// Step 1: user submits their email on /forgot-password. We mint a recovery
// token server-side (admin.generateLink), build a link straight to our own
// /auth/confirm route, and email it via Resend — so this works with zero
// Supabase Site-URL / redirect-allowlist / email-template configuration.
// /auth/confirm verifies the token (verifyOtp) and opens a short-lived recovery
// session, then forwards to /reset-password.
// We always return the same neutral confirmation regardless of whether the email
// is registered, so this endpoint can't be used to enumerate accounts.
export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  if (!email || !email.includes('@')) {
    redirect(`/forgot-password?error=${encodeURIComponent('Enter a valid email address.')}`)
  }

  const origin = await getOrigin()

  try {
    const admin = serviceClient()
    // generateLink errors for unregistered emails — caught below so we stay neutral.
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email })
    const tokenHash = data?.properties?.hashed_token
    if (!error && tokenHash) {
      const link =
        `${origin}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}` +
        `&type=recovery&next=/reset-password`
      await sendEmail({
        to: email,
        subject: 'Reset your Pathfinder password',
        html: passwordResetEmailHtml(link),
      })
    }
  } catch {
    // Never reveal whether the account exists or that sending failed.
  }

  redirect('/forgot-password?sent=1')
}

// Step 2: user is on /reset-password with a recovery session and submits a new
// password. updateUser changes it on the now-authenticated session.
export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 8) {
    redirect(`/reset-password?error=${encodeURIComponent('Password must be at least 8 characters.')}`)
  }
  if (password !== confirm) {
    redirect(`/reset-password?error=${encodeURIComponent('Passwords do not match.')}`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/forgot-password?error=${encodeURIComponent('Your reset link expired. Request a new one.')}`)
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
