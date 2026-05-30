import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let status = 'pending'
  try {
    const body = await request.json() as { status?: string }
    if (body.status) status = body.status
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Check for an existing outcome for this opportunity
  const { data: existing } = await supabase
    .from('outcomes')
    .select('id')
    .eq('user_id', user.id)
    .eq('opportunity_id', id)
    .maybeSingle()

  let outcomeId: string

  if (existing) {
    const { error } = await supabase
      .from('outcomes')
      .update({ status, decided_at: status !== 'pending' ? new Date().toISOString() : null })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    outcomeId = existing.id
  } else {
    const { data: inserted, error } = await supabase
      .from('outcomes')
      .insert({ user_id: user.id, opportunity_id: id, status })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    outcomeId = inserted.id
  }

  // Mark opportunity as applied
  await supabase
    .from('opportunities')
    .update({ applied: true })
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true, outcome_id: outcomeId })
}
