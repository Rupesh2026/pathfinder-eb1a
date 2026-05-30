import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ rank: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rank: rankStr } = await params
  const rank = parseInt(rankStr, 10)
  if (isNaN(rank) || rank < 1 || rank > 10) {
    return NextResponse.json({ error: 'Invalid rank' }, { status: 400 })
  }

  let done: boolean
  try {
    ;({ done } = await request.json() as { done: boolean })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const today = new Date().toISOString().slice(0, 10)

  const { data: plan, error: fetchError } = await supabase
    .from('daily_plans')
    .select('id, actions')
    .eq('user_id', user.id)
    .eq('plan_date', today)
    .single()

  if (fetchError || !plan) {
    return NextResponse.json({ error: 'No plan found for today' }, { status: 404 })
  }

  const updated = (plan.actions as { rank: number; done: boolean }[]).map(a =>
    a.rank === rank ? { ...a, done } : a
  )

  const { error } = await supabase
    .from('daily_plans')
    .update({ actions: updated })
    .eq('id', plan.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
