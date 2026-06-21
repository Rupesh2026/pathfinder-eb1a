'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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
