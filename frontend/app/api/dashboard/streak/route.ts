import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MOCK_STREAK } from '@/lib/mock-data'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use local date strings to avoid timezone-shifted date boundaries
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const { data: plans } = await supabase
    .from('daily_plans')
    .select('plan_date, actions')
    .eq('user_id', user.id)
    .gte('plan_date', toLocalDateStr(thirtyDaysAgo))
    .order('plan_date', { ascending: true })

  if (!plans || plans.length === 0) {
    return NextResponse.json(MOCK_STREAK)
  }

  // Build a map: date → active (any task done)
  const activeMap = new Map<string, boolean>()
  for (const plan of plans) {
    const anyDone = (plan.actions as { done: boolean }[]).some(a => a.done)
    activeMap.set(plan.plan_date, anyDone)
  }

  // Build the 30-day calendar
  const calendar: { date: string; active: boolean }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    calendar.push({ date: dateStr, active: activeMap.get(dateStr) ?? false })
  }

  // Compute streak: consecutive active days from today backward
  let streak = 0
  for (let i = calendar.length - 1; i >= 0; i--) {
    const { date, active } = calendar[i]
    const isToday = date === today.toISOString().slice(0, 10)
    if (active) {
      streak++
    } else if (isToday) {
      // Today not yet active — don't break streak
      continue
    } else {
      break
    }
  }

  return NextResponse.json({ streak_days: streak, calendar })
}
