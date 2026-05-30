'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CriterionType } from '@/lib/types'

export async function addEvidence(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const criterion = formData.get('criterion') as CriterionType
  const title = (formData.get('title') as string).trim()

  if (!criterion || !title) {
    return { error: 'Criterion and title are required.' }
  }

  const { error } = await supabase.from('evidence').insert({
    user_id: user.id,
    criterion,
    title,
    description: (formData.get('description') as string).trim() || null,
    url: (formData.get('url') as string).trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/evidence')
  return { success: true }
}

export async function deleteEvidence(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('evidence')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/evidence')
  return { success: true }
}
