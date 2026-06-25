'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_STRATEGY_WEIGHTS, type CriterionType, type SalaryBand } from '@/lib/types'

type EvidenceInput = {
  criterion: CriterionType
  title: string
  description: string
  url: string
}

export async function saveOnboarding(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Save the display name to auth user metadata (surfaced on the dashboard).
  const name = (formData.get('name') as string | null)?.trim()
  if (name) {
    await supabase.auth.updateUser({ data: { full_name: name } })
  }

  const evidenceRaw = formData.get('evidence') as string
  let evidenceItems: EvidenceInput[] = []

  try {
    evidenceItems = JSON.parse(evidenceRaw)
  } catch {
    return { error: 'Invalid evidence data' }
  }

  const validEvidence = evidenceItems.filter((e) => e.criterion && e.title.trim())
  if (validEvidence.length === 0) {
    return { error: 'At least one evidence item with a criterion and title is required.' }
  }

  // Upsert (not insert) on user_id: profiles has UNIQUE(user_id), so a plain
  // insert throws "duplicate key value violates unique constraint
  // profile_user_id_key" if the user re-runs onboarding, double-submits, or
  // retries after a first attempt where the profile saved but evidence failed.
  // Upsert makes re-submission idempotent — it updates the existing row instead.
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      user_id: user.id,
      domain: formData.get('domain') as string,
      role: formData.get('role') as string,
      salary_band: formData.get('salary_band') as SalaryBand,
      country_of_origin: formData.get('country_of_origin') as string,
      target_field: formData.get('target_field') as string,
      strategy_weights: DEFAULT_STRATEGY_WEIGHTS,
    },
    { onConflict: 'user_id' }
  )

  if (profileError) {
    return { error: profileError.message }
  }

  const evidenceRows = validEvidence.map((e) => ({
    user_id: user.id,
    criterion: e.criterion,
    title: e.title.trim(),
    description: e.description.trim() || null,
    url: e.url.trim() || null,
  }))

  const { error: evidenceError } = await supabase.from('evidence').insert(evidenceRows)

  if (evidenceError) {
    return { error: evidenceError.message }
  }

  redirect('/dashboard')
}
