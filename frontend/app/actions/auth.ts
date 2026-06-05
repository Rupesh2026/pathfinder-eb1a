'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/signin?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signUp({
    email,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  // Mark evaluator assessment as converted (fire-and-forget)
  const assessmentId = formData.get('assessment_id') as string | null
  if (assessmentId && email) {
    try {
      const db = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await db
        .from('evaluator_assessments')
        .update({ converted_at: new Date().toISOString() })
        .eq('id', assessmentId)
        .eq('email', email)
    } catch {
      // Non-fatal — don't block signup
    }
  }

  redirect('/onboarding')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/signin')
}
