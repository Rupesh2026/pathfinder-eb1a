import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('focused_criteria')
    .eq('user_id', user.id)
    .single()

  const focusedCriteria: string[] = profile?.focused_criteria ?? []

  let query = supabase
    .from('opportunities')
    .select('id, title, criterion, deadline')
    .eq('user_id', user.id)
    .eq('dismissed', false)
    .eq('applied', false)
    .not('deadline', 'is', null)
    .order('deadline', { ascending: true })
    .limit(5)

  if (focusedCriteria.length > 0) {
    query = query.in('criterion', focusedCriteria)
  }

  const { data: opps } = await query
  return NextResponse.json(opps ?? [])
}
