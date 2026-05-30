'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CriterionType } from '@/lib/types'

export async function addLetter(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = (formData.get('recommender_name') as string).trim()
  if (!name) return { error: 'Recommender name is required.' }

  const criteriaRaw = formData.get('criteria') as string
  const criteria = criteriaRaw
    ? (criteriaRaw.split(',').map(c => c.trim()).filter(Boolean) as CriterionType[])
    : []

  const { error } = await supabase.from('recommendation_letters').insert({
    user_id: user.id,
    recommender_name: name,
    recommender_title: (formData.get('recommender_title') as string).trim() || null,
    recommender_institution: (formData.get('recommender_institution') as string).trim() || null,
    relationship: (formData.get('relationship') as string).trim() || null,
    criteria: criteria.length > 0 ? criteria : null,
    notes: (formData.get('notes') as string).trim() || null,
    target_date: (formData.get('target_date') as string) || null,
    status: 'not_asked',
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/letters')
  return { success: true }
}

export async function updateLetterStatus(id: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updates: Record<string, unknown> = { status }
  if (status === 'asked') updates.requested_at = new Date().toISOString()
  if (status === 'received') updates.received_at = new Date().toISOString()

  const { error } = await supabase
    .from('recommendation_letters')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/letters')
  return { success: true }
}

export async function deleteLetter(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('recommendation_letters')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/letters')
  return { success: true }
}
