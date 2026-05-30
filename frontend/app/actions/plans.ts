'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markActionDone(planId: string, rank: number, done: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: plan } = await supabase
    .from('daily_plans')
    .select('actions')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!plan) return { error: 'Plan not found' }

  const updated = plan.actions.map((a: { rank: number; done: boolean }) =>
    a.rank === rank ? { ...a, done } : a
  )

  const { error } = await supabase
    .from('daily_plans')
    .update({ actions: updated })
    .eq('id', planId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
