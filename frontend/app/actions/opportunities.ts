'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function dismissOpportunity(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('opportunities')
    .update({ dismissed: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/opportunities')
  return { success: true }
}

export async function markApplied(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error: oppError } = await supabase
    .from('opportunities')
    .update({ applied: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (oppError) return { error: oppError.message }

  // Create a pending outcome so the user can later record the result
  const { error: outcomeError } = await supabase
    .from('outcomes')
    .insert({ user_id: user.id, opportunity_id: id, status: 'pending' })

  if (outcomeError) return { error: outcomeError.message }

  revalidatePath('/dashboard/opportunities')
  return { success: true }
}
