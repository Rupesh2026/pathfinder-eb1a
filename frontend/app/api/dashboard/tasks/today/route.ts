import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MOCK_TASKS } from '@/lib/mock-data'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)

  const { data: plan } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_date', today)
    .single()

  if (!plan) {
    return NextResponse.json(MOCK_TASKS)
  }

  return NextResponse.json({
    plan_id: plan.id,
    plan_date: plan.plan_date,
    actions: plan.actions,
  })
}
